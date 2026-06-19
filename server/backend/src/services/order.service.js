const { orderRepository, userRepository, statsRepository, menuRepository } = require('../repositories');
const { generateOrderId, generateDeliveryCode } = require('../utils/id-generator.utils');
const ApplicationError = require('../domain/errors/application-error');
const { canModifyOrder } = require('./auth.service');

const STATE_MACHINE = {
  staff: {
    pending: ['processing'],
    processing: ['delivering'],
    delivering: ['delivered']
  },
  manager: {
    pending: ['processing', 'issue'],
    processing: ['delivering', 'issue'],
    delivering: ['delivered', 'issue'],
    delivered: ['issue'],
    issue: ['pending', 'processing', 'delivering']
  },
  owner: {
    pending: ['processing', 'issue'],
    processing: ['delivering', 'issue'],
    delivering: ['delivered', 'issue'],
    delivered: ['issue'],
    issue: ['pending', 'processing', 'delivering']
  },
  admin: {
    pending: ['processing', 'delivering', 'delivered', 'issue'],
    processing: ['pending', 'delivering', 'delivered', 'issue'],
    delivering: ['pending', 'processing', 'delivered', 'issue'],
    delivered: ['pending', 'processing', 'delivering', 'issue'],
    issue: ['pending', 'processing', 'delivering', 'delivered']
  }
};

const VALID_STATUSES = ['pending', 'processing', 'delivering', 'delivered', 'issue', 'cancelled'];

class OrderService {
  constructor(orderRepo, userRepo, statsRepo, menuRepo) {
    this.orderRepo = orderRepo;
    this.userRepo = userRepo;
    this.statsRepo = statsRepo;
    this.menuRepo = menuRepo;
  }

  async create(data, authenticatedUserId) {
    const { items, restaurantId, restaurantName, userId, paymentMethod } = data;

    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }

    const validatedItems = await this._validateAndNormalizeItems(items, restaurantId);

    const orderId = generateOrderId();
    const now = new Date();

    const deliveryCode = paymentMethod === 'cash' ? generateDeliveryCode() : null;

    const recalculatedTotal = this._calculateOrderTotal(validatedItems);

    const orderData = {
      id: orderId,
      user_id: userId,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      total: recalculatedTotal,
      payment_method: paymentMethod || 'card',
      delivery_code: deliveryCode,
      status: 'pending',
      status_note: null,
      created_at: now,
      updated_at: now
    };

    const order = await this.orderRepo.createWithItems(orderData, validatedItems);

    await this._clearUserCart(userId);

    await this.userRepo.incrementOrdersCount(userId);

    for (const item of validatedItems) {
      if (!item.id) continue;
      const qty = item.quantity || 1;
      await this.statsRepo.recordStat(restaurantId, item.id, qty);

      if (item.variant?.variantId) {
        await this.statsRepo.recordStat(restaurantId, `${item.id}|${item.variant.variantId}`, qty);
      }
    }

    return { order, items: validatedItems, now, deliveryCode };
  }

  async getByUser(userId, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }
    return this.orderRepo.findByUserId(userId);
  }

  async updateStatus(orderId, status, statusNote, authenticatedUserId, userRole) {
    if (!VALID_STATUSES.includes(status)) {
      throw new ApplicationError('Estado no válido', 400);
    }

    const order = await this.orderRepo.findUnique({ id: orderId });
    if (!order) {
      throw new ApplicationError('Orden no encontrada', 404);
    }

    if (!canModifyOrder(userRole, order.user_id, authenticatedUserId)) {
      throw new ApplicationError('No autorizado para modificar esta orden', 403);
    }

    this._validateStateTransition(order.status, status, userRole);

    if (status === 'cancelled' && (!statusNote || statusNote.trim().length < 3)) {
      throw new ApplicationError('La cancelación requiere un motivo', 400);
    }

    return this.orderRepo.update(
      { id: orderId },
      {
        status,
        status_note: statusNote || null,
        updated_at: new Date()
      }
    );
  }

  async _validateAndNormalizeItems(items, restaurantId) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApplicationError('La orden debe contener al menos un item', 400);
    }

    const menuItems = await this.menuRepo.findByRestaurantId(restaurantId);
    const menuMap = new Map(menuItems.map(m => [m.id, m]));

    const validated = [];

    for (const item of items) {
      const menuItem = menuMap.get(item.id);
      if (!menuItem) {
        throw new ApplicationError(`Item no encontrado en el menú: ${item.id}`, 404);
      }

      const basePrice = parseFloat(menuItem.price);
      let finalPrice = basePrice;

      let normalizedVariant = null;
      if (item.variant?.variantId && menuItem.variants?.length > 0) {
        const variantGroup = menuItem.variants[0];
        const variantItem = variantGroup.items?.find(v => v.item_id === item.variant.variantId);
        if (!variantItem) {
          throw new ApplicationError(`Variante no válida: ${item.variant.variantId}`, 400);
        }
        finalPrice = parseFloat(variantItem.price);
        normalizedVariant = {
          variantId: variantItem.item_id,
          variantName: variantItem.name,
          price: finalPrice
        };
      }

      const normalizedOptions = [];
      if (item.options?.length > 0 && menuItem.options?.length > 0) {
        for (const opt of item.options) {
          const menuOption = menuItem.options.find(o => o.option_id === opt.optionId);
          if (!menuOption) {
            throw new ApplicationError(`Opción no válida: ${opt.optionId}`, 400);
          }
          const menuChoice = menuOption.choices?.find(c => c.choice_id === opt.choiceId);
          if (!menuChoice) {
            throw new ApplicationError(`Selección no válida: ${opt.choiceId}`, 400);
          }
          const modifier = parseFloat(menuChoice.price_modifier || 0);
          finalPrice += modifier;
          normalizedOptions.push({
            optionId: menuOption.option_id,
            optionName: menuOption.name,
            choiceId: menuChoice.choice_id,
            choiceName: menuChoice.name,
            priceModifier: modifier
          });
        }
      }

      const sentPrice = parseFloat(item.price || 0);
      if (Math.abs(sentPrice - finalPrice) > 0.05) {
        throw new ApplicationError(
          `Precio manipulado para ${item.name}: enviado ${sentPrice}, calculado ${finalPrice.toFixed(2)}`,
          400
        );
      }

      validated.push({
        id: item.id,
        name: item.name || menuItem.name,
        baseName: item.baseName || menuItem.name,
        price: finalPrice,
        basePrice: basePrice,
        quantity: item.quantity || 1,
        variant: normalizedVariant,
        options: normalizedOptions,
        image: item.image || menuItem.image
      });
    }

    return validated;
  }

  _calculateOrderTotal(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  }

  _validateStateTransition(currentStatus, newStatus, userRole) {
    if (userRole === 'admin') return;

    const transitions = STATE_MACHINE[userRole];
    if (!transitions) {
      throw new ApplicationError('Rol no válido para cambios de estado', 403);
    }

    const allowed = transitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ApplicationError(
        `Transición no permitida para ${userRole}: ${currentStatus} → ${newStatus}`,
        403
      );
    }
  }

  async _clearUserCart(userId) {
    const { cartRepository } = require('../repositories');
    try {
      await cartRepository.deleteMany({ user_id: userId });
    } catch (err) {
      console.warn('No se pudo limpiar carrito después de orden:', err.message);
    }
  }
}

module.exports = new OrderService(orderRepository, userRepository, statsRepository, menuRepository);
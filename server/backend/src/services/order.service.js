const { orderRepository, userRepository, statsRepository } = require('../repositories');
const { generateOrderId } = require('../utils/id-generator.utils');
const ApplicationError = require('../domain/errors/application-error');

class OrderService {
  constructor(orderRepo, userRepo, statsRepo) {
    this.orderRepo = orderRepo;
    this.userRepo = userRepo;
    this.statsRepo = statsRepo;
  }

  async create(data, authenticatedUserId) {
    const { items, total, restaurantId, restaurantName, userId, paymentMethod, deliveryCode } = data;

    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }

    const orderId = generateOrderId();
    const now = new Date();

    const orderData = {
      id: orderId,
      user_id: userId,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      total,
      payment_method: paymentMethod || 'card',
      delivery_code: deliveryCode || null,
      status: 'pending',
      status_note: null,
      created_at: now,
      updated_at: now
    };

    const order = await this.orderRepo.createWithItems(orderData, items);

    await this.userRepo.incrementOrdersCount(userId);

    for (const item of items) {
      if (!item.id) continue;
      const qty = item.quantity || 1;

      await this.statsRepo.recordStat(restaurantId, item.id, qty);

      if (item.variant?.variantId) {
        const vKey = `${item.id}|${item.variant.variantId}`;
        await this.statsRepo.recordStat(restaurantId, vKey, qty);
      }
    }

    return { order, items, now };
  }

  async getByUser(userId, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }
    return this.orderRepo.findByUserId(userId);
  }

  async updateStatus(orderId, status, statusNote) {
    const validStatuses = ['pending', 'processing', 'delivering', 'delivered', 'issue'];
    if (!validStatuses.includes(status)) {
      throw new ApplicationError('Estado no válido', 400);
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
}

module.exports = new OrderService(orderRepository, userRepository, statsRepository);
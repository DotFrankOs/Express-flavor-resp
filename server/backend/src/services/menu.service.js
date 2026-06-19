const { menuRepository, restaurantRepository } = require('../repositories');
const ApplicationError = require('../domain/errors/application-error');

class MenuService {
  constructor(repo, restaurantRepo) {
    this.repo = repo;
    this.restaurantRepo = restaurantRepo;
  }

  async getMenuByRestaurantId(restaurantId) {
    return this.repo.findByRestaurantId(restaurantId);
  }

  async createItem(restaurantId, data) {
    const restaurant = await this.restaurantRepo.findUnique({ id: restaurantId });
    if (!restaurant) throw new ApplicationError('Restaurante no encontrado', 404);

    const existing = await this.repo.findUnique({ id: data.id });
    if (existing) throw new ApplicationError('Ya existe un item con ese ID', 409);

    const item = await this.repo.create({
      id: data.id,
      restaurant_id: restaurantId,
      name: data.name,
      price: data.price,
      image: data.image || null,
      description: data.description || null,
      is_active: true
    });

    if (data.variants?.items?.length > 0) {
      const variant = await this.repo.createVariant({
        menu_item_id: data.id,
        required: data.variants.required || false
      });
      
      for (const vItem of data.variants.items) {
        await this.repo.createVariantItem({
          variant_id: variant.id,
          item_id: vItem.id,
          name: vItem.name,
          price: vItem.price
        });
      }
    }

    if (data.options?.length > 0) {
      for (const opt of data.options) {
        const option = await this.repo.createOption({
          menu_item_id: data.id,
          option_id: opt.id,
          name: opt.name,
          required: opt.required || false,
          multi_select: opt.multiSelect || false
        });

        for (const choice of opt.choices) {
          await this.repo.createOptionChoice({
            option_id: option.id,
            choice_id: choice.id,
            name: choice.name,
            price_modifier: choice.priceModifier || 0
          });
        }
      }
    }

    return this.repo.findUnique({ id: data.id }, {
      include: {
        options: { include: { choices: true } },
        variants: { include: { items: true } }
      }
    });
  }

  async updateItem(restaurantId, itemId, data) {
    const item = await this.repo.findUnique({ id: itemId });
    if (!item || item.restaurant_id !== restaurantId) {
      throw new ApplicationError('Item no encontrado en este restaurante', 404);
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    return this.repo.update({ id: itemId }, updateData);
  }

  async toggleItem(restaurantId, itemId) {
    const item = await this.repo.findUnique({ id: itemId });
    if (!item || item.restaurant_id !== restaurantId) {
      throw new ApplicationError('Item no encontrado', 404);
    }

    return this.repo.update(
      { id: itemId },
      { is_active: !item.is_active }
    );
  }

  async getAllMenuByRestaurantId(restaurantId) {
    return this.repo.findAllByRestaurantId(restaurantId);
  }

  async deleteItem(restaurantId, itemId) {
    const item = await this.repo.findUnique({ id: itemId });
    if (!item || item.restaurant_id !== restaurantId) {
      throw new ApplicationError('Item no encontrado', 404);
    }

    const pendingOrders = await this.repo.countPendingOrdersWithItem(itemId);
    if (pendingOrders > 0) {
      throw new ApplicationError('No se puede eliminar: hay órdenes pendientes con este item', 409);
    }

    await this.repo.delete({ id: itemId });
    return { success: true };
  }
}

module.exports = new MenuService(menuRepository, restaurantRepository);
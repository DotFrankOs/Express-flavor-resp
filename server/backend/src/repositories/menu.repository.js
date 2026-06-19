const BaseRepository = require('./base.repository');

class MenuRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'menuItem');
  }

  async findByRestaurantId(restaurantId) {
    return this.findMany(
      { 
        restaurant_id: restaurantId,
        is_active: true
      },
      {
        include: {
          options: { include: { choices: true } },
          variants: { include: { items: true } }
        }
      }
    );
  }

  async findAllByRestaurantId(restaurantId) {
    return this.findMany(
      { restaurant_id: restaurantId },
      {
        include: {
          options: { include: { choices: true } },
          variants: { include: { items: true } }
        }
      }
    );
  }

  async createVariant(data) {
    return this.db.create('menuItemVariant', data);
  }

  async createVariantItem(data) {
    return this.db.create('menuItemVariantItem', data);
  }

  async createOption(data) {
    return this.db.create('menuItemOption', data);
  }

  async createOptionChoice(data) {
    return this.db.create('menuItemOptionChoice', data);
  }

  async countPendingOrdersWithItem(itemId) {
    return this.db.count('orderItem', {
      item_id: itemId,
      order: { status: { in: ['pending', 'processing'] } }
    });
  }
}

module.exports = MenuRepository;
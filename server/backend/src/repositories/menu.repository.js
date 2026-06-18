const BaseRepository = require('./base.repository');

class MenuRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'menuItem');
  }

  async findByRestaurantId(restaurantId) {
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
}

module.exports = MenuRepository;
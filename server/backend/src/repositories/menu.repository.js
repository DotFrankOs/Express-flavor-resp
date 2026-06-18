const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class MenuRepository extends BaseRepository {
  constructor() {
    super(prisma.menuItem);
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

module.exports = new MenuRepository();
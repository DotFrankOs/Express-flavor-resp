const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class TableRepository extends BaseRepository {
  constructor() {
    super(prisma.table);
  }

  async findByRestaurantId(restaurantId) {
    return this.findMany(
      { restaurant_id: restaurantId },
      { orderBy: { id: 'asc' } }
    );
  }

  async findLayoutByRestaurantId(restaurantId) {
    return prisma.tableLayout.findUnique({
      where: { restaurant_id: restaurantId }
    });
  }
}

module.exports = new TableRepository();
const BaseRepository = require('./base.repository');

class TableRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'table');
  }

  async findByRestaurantId(restaurantId) {
    return this.findMany(
      { restaurant_id: restaurantId },
      { orderBy: { id: 'asc' } }
    );
  }

  async findLayoutByRestaurantId(restaurantId) {
    return this.db.findUnique('tableLayout', { restaurant_id: restaurantId });
  }

  async findTableById(restaurantId, tableId) {
    return this.findFirst({
      id: tableId,
      restaurant_id: restaurantId
    });
  }
}

module.exports = TableRepository;
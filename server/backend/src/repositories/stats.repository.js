const BaseRepository = require('./base.repository');

class StatsRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'itemStat');
  }

  async findByRestaurantId(restaurantId) {
    return this.findMany({ restaurant_id: restaurantId });
  }

  async findTopByRestaurantId(restaurantId, limit) {
    return this.findMany(
      {
        restaurant_id: restaurantId,
        NOT: { item_key: { contains: '|' } }
      },
      {
        orderBy: { count: 'desc' },
        take: limit
      }
    );
  }

  async findItemAndVariants(restaurantId, itemId) {
    return this.findMany({
      restaurant_id: restaurantId,
      OR: [
        { item_key: itemId },
        { item_key: { startsWith: `${itemId}|` } }
      ]
    });
  }

  async findVariants(restaurantId, itemId) {
    return this.findMany({
      restaurant_id: restaurantId,
      item_key: { startsWith: `${itemId}|` }
    });
  }

  async recordStat(restaurantId, itemKey, quantity) {
    return this.upsert(
      { restaurant_id_item_key: { restaurant_id: restaurantId, item_key: itemKey } },
      { count: { increment: quantity } },
      { restaurant_id: restaurantId, item_key: itemKey, count: quantity }
    );
  }
}

module.exports = StatsRepository;
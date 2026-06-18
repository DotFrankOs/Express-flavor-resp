const BaseRepository = require('./base.repository');

class StaffRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'userRestaurant');
    this.db = dbAdapter;
  }

  async findUserRestaurant(userId, restaurantId) {
    return this.findFirst({
      user_id: userId,
      restaurant_id: restaurantId
    });
  }

  async findUserRestaurants(userId) {
    return this.findMany(
      { user_id: userId },
      { include: { restaurant: true } }
    );
  }

  async findActiveReservations(restaurantId, today) {
    return this.db.findMany('reservation', {
      restaurant_id: restaurantId,
      start_time: { gte: today }
    }, { orderBy: { start_time: 'asc' } });
  }

  async findTopItems(restaurantId, limit) {
    return this.db.findMany('itemStat', {
      restaurant_id: restaurantId
    }, {
      orderBy: { count: 'desc' },
      take: limit
    });
  }
}

module.exports = StaffRepository;
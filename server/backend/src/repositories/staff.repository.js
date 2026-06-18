const prisma = require('../lib/prisma');

class StaffRepository {
  async findUserRestaurant(userId, restaurantId) {
    return prisma.userRestaurant.findFirst({
      where: { user_id: userId, restaurant_id: restaurantId }
    });
  }

  async findUserRestaurants(userId) {
    return prisma.userRestaurant.findMany({
      where: { user_id: userId },
      include: { restaurant: true }
    });
  }

  async findActiveReservations(restaurantId, today) {
    return prisma.reservation.findMany({
      where: {
        restaurant_id: restaurantId,
        start_time: { gte: today }
      },
      orderBy: { start_time: 'asc' }
    });
  }

  async findTopItems(restaurantId, limit) {
    return prisma.itemStat.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { count: 'desc' },
      take: limit
    });
  }
}

module.exports = new StaffRepository();
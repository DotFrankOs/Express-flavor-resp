const BaseRepository = require('./base.repository');

class ReservationRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'reservation');
  }

  async findByRestaurantId(restaurantId) {
    return this.findMany({ restaurant_id: restaurantId });
  }

  async findByUserId(userId) {
    return this.findMany(
      { user_id: userId },
      {
        include: { restaurant: true },
        orderBy: { start_time: 'asc' }
      }
    );
  }

  async findByTableAndTime(restaurantId, tableNumber, startTime) {
    return this.findFirst({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      start_time: new Date(startTime)
    });
  }

  async deleteByTableAndTime(restaurantId, tableNumber, startTime) {
    return this.deleteMany({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      start_time: new Date(startTime)
    });
  }

  async replaceAllForRestaurant(restaurantId, reservations) {
    return this.transaction(async (tx) => {
      await tx.reservation.deleteMany({ where: { restaurant_id: restaurantId } });
      
      for (const r of reservations) {
        await tx.reservation.create({
          data: {
            restaurant_id: restaurantId,
            table_number: r.number,
            start_time: new Date(r.startTime),
            end_time: new Date(r.endTime),
            duration: r.duration,
            code: r.code,
            user_id: r.userId
          }
        });
      }
    });
  }
}

module.exports = ReservationRepository;
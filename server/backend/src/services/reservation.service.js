const { reservationRepository } = require('../repositories');
const ApplicationError = require('../domain/errors/application-error');

class ReservationService {
  constructor(repo) {
    this.repo = repo;
  }

  async getAllByRestaurantId(restaurantId) {
    return this.repo.findByRestaurantId(restaurantId);
  }

  async create(restaurantId, data, userId) {
    if (data.userId !== userId) {
      throw new ApplicationError('No autorizado', 403);
    }

    return this.repo.create({
      restaurant_id: restaurantId,
      table_number: data.number,
      start_time: data.startTime,
      end_time: data.endTime,
      duration: data.duration,
      code: data.code,
      user_id: userId
    });
  }

  async replaceAll(restaurantId, reservations) {
    return this.repo.replaceAllForRestaurant(restaurantId, reservations);
  }

  async remove(restaurantId, tableNumber, startTime, userId) {
    const check = await this.repo.findByTableAndTime(restaurantId, tableNumber, startTime);
    if (!check) {
      throw new ApplicationError('Reserva no encontrada', 404);
    }
    if (check.user_id !== userId) {
      throw new ApplicationError('No autorizado', 403);
    }

    await this.repo.deleteByTableAndTime(restaurantId, tableNumber, startTime);
    return { success: true };
  }

  async getMyReservations(userId) {
    return this.repo.findByUserId(userId);
  }
}

module.exports = new ReservationService(reservationRepository);
const { reservationRepository, restaurantRepository } = require('../repositories');
const { generateReservationCode } = require('../utils/id-generator.utils');
const ApplicationError = require('../domain/errors/application-error');

const TABLE_PRICING = {
  standard: 0,
  bar: 0,
  terraza: 2.00,
  vip: 5.00
};

class ReservationService {
  constructor(repo, restaurantRepo) {
    this.repo = repo;
    this.restaurantRepo = restaurantRepo;
  }

  async getAllByRestaurantId(restaurantId) {
    return this.repo.findByRestaurantId(restaurantId);
  }

  async create(restaurantId, data, userId) {
    if (data.userId !== userId) {
      throw new ApplicationError('No autorizado', 403);
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    await this._validateBusinessHours(restaurantId, startTime, endTime);

    await this._checkAvailabilityWithLock(restaurantId, data.number, startTime, endTime);

    const tablePrice = await this._calculateTablePrice(restaurantId, data.number);

    const reservation = await this.repo.create({
      restaurant_id: restaurantId,
      table_number: data.number,
      start_time: startTime,
      end_time: endTime,
      duration: data.duration,
      code: generateReservationCode(),
      user_id: userId,
      price: tablePrice,
      status: 'active'
    });

    return reservation;
  }

  async cancel(restaurantId, tableNumber, startTime, userId, reason) {
    if (!reason || reason.trim().length < 3) {
      throw new ApplicationError('La cancelación requiere un motivo', 400);
    }

    const check = await this.repo.findByTableAndTime(restaurantId, tableNumber, startTime);
    if (!check) {
      throw new ApplicationError('Reserva no encontrada', 404);
    }

    if (check.user_id !== userId) {
      const { staffRepository } = require('../repositories');
      const access = await staffRepository.findUserRestaurant(userId, restaurantId);
      if (!access && userId !== 'admin') {
        throw new ApplicationError('No autorizado', 403);
      }
    }

    const now = new Date();
    if (new Date(check.start_time) < now) {
      throw new ApplicationError('No se puede cancelar una reserva que ya inició', 400);
    }

    return this.repo.update(
      { id: check.id },
      {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date(),
        cancelled_by: userId
      }
    );
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

  async _checkAvailabilityWithLock(restaurantId, tableNumber, startTime, endTime) {
    const lockKey = `reservation_lock_${restaurantId}_${tableNumber}`;

    const existing = await this.repo.findOverlapping(
      restaurantId,
      tableNumber,
      startTime,
      endTime,
      ['active']
    );

    if (existing.length > 0) {
      throw new ApplicationError(
        `La mesa ${tableNumber} ya está reservada en el horario solicitado`,
        409
      );
    }

    const doubleCheck = await this.repo.findOverlapping(
      restaurantId,
      tableNumber,
      startTime,
      endTime,
      ['active']
    );

    if (doubleCheck.length > 0) {
      throw new ApplicationError(
        `La mesa ${tableNumber} fue reservada por otro usuario. Intenta con otro horario.`,
        409
      );
    }
  }

  async _calculateTablePrice(restaurantId, tableNumber) {
    const tables = await this.restaurantRepo.findTablesByRestaurantId(restaurantId);
    const table = tables.find(t => t.id === tableNumber);
    if (!table) {
      throw new ApplicationError(`Mesa ${tableNumber} no encontrada`, 404);
    }

    return TABLE_PRICING[table.style] || TABLE_PRICING.standard;
  }

  async _validateBusinessHours(restaurantId, startTime, endTime) {
    const now = new Date();
    if (startTime < now) {
      throw new ApplicationError('No se puede reservar en el pasado', 400);
    }

    const maxAdvanceDays = 30;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
    if (startTime > maxDate) {
      throw new ApplicationError(`No se puede reservar con más de ${maxAdvanceDays} días de anticipación`, 400);
    }

    const hour = startTime.getHours();
    if (hour < 8 || hour >= 22) {
      throw new ApplicationError('Las reservas solo están disponibles de 8:00 a 22:00', 400);
    }

    const endHour = endTime.getHours();
    if (endHour > 22 || (endHour === 22 && endTime.getMinutes() > 0)) {
      throw new ApplicationError('La reserva debe terminar antes de las 22:00', 400);
    }
  }
}

module.exports = new ReservationService(reservationRepository, restaurantRepository);
const { staffRepository, orderRepository, statsRepository } = require('../repositories');
const { getTodayRange } = require('../utils/date.utils');
const ApplicationError = require('../domain/errors/application-error');

class StaffService {
  constructor(staffRepo, orderRepo, statsRepo) {
    this.staffRepo = staffRepo;
    this.orderRepo = orderRepo;
    this.statsRepo = statsRepo;
  }

  async getMyRestaurants(userId) {
    return this.staffRepo.findUserRestaurants(userId);
  }

  async getDashboard(userId, restaurantId) {
    const access = await this.staffRepo.findUserRestaurant(userId, restaurantId);
    if (!access) {
      throw new ApplicationError('No tienes acceso a este restaurante', 403);
    }

    const { today, tomorrow } = getTodayRange();

    const todayOrders = await this.orderRepo.findTodayOrders(restaurantId, today, tomorrow);
    const activeReservations = await this.staffRepo.findActiveReservations(restaurantId, today);
    const topItems = await this.staffRepo.findTopItems(restaurantId, 5);

    const summary = {
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0),
      pendingOrders: todayOrders.filter(o => o.status === 'pending').length,
      activeReservations: activeReservations.length
    };

    return {
      access,
      summary,
      orders: todayOrders,
      reservations: activeReservations,
      topItems
    };
  }

  async updateOrderStatus(userId, orderId, status, statusNote) {
    const validStatuses = ['pending', 'processing', 'delivering', 'delivered', 'issue'];
    if (!validStatuses.includes(status)) {
      throw new ApplicationError('Estado no válido', 400);
    }

    const order = await this.orderRepo.findUnique({ id: orderId });
    if (!order) {
      throw new ApplicationError('Orden no encontrada', 404);
    }

    const access = await this.staffRepo.findUserRestaurant(userId, order.restaurant_id);
    if (!access) {
      throw new ApplicationError('No autorizado', 403);
    }

    return this.orderRepo.update(
      { id: orderId },
      {
        status,
        status_note: statusNote || null,
        updated_at: new Date()
      }
    );
  }
}

module.exports = new StaffService(staffRepository, orderRepository, statsRepository);
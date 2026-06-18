const { staffRepository, orderRepository, statsRepository } = require('../repositories');
const { getTodayRange } = require('../utils/date.utils');
const ApplicationError = require('../domain/errors/application-error');
const { canAccessDashboard } = require('./auth.service');

const STAFF_STATE_MACHINE = {
  staff: {
    pending: ['processing'],
    processing: ['delivering'],
    delivering: ['delivered']
  },
  manager: {
    pending: ['processing', 'issue'],
    processing: ['delivering', 'issue'],
    delivering: ['delivered', 'issue'],
    delivered: ['issue'],
    issue: ['pending', 'processing', 'delivering']
  },
  owner: {
    pending: ['processing', 'issue'],
    processing: ['delivering', 'issue'],
    delivering: ['delivered', 'issue'],
    delivered: ['issue'],
    issue: ['pending', 'processing', 'delivering']
  },
  admin: {
    pending: ['processing', 'delivering', 'delivered', 'issue', 'cancelled'],
    processing: ['pending', 'delivering', 'delivered', 'issue', 'cancelled'],
    delivering: ['pending', 'processing', 'delivered', 'issue', 'cancelled'],
    delivered: ['pending', 'processing', 'delivering', 'issue', 'cancelled'],
    issue: ['pending', 'processing', 'delivering', 'delivered', 'cancelled'],
    cancelled: ['pending', 'processing', 'delivering', 'delivered', 'issue']
  }
};

class StaffService {
  constructor(staffRepo, orderRepo, statsRepo) {
    this.staffRepo = staffRepo;
    this.orderRepo = orderRepo;
    this.statsRepo = statsRepo;
  }

  async getMyRestaurants(userId) {
    return this.staffRepo.findUserRestaurants(userId);
  }

  async getDashboard(userId, restaurantId, userRole) {
    if (!canAccessDashboard(userRole)) {
      throw new ApplicationError('No tienes permiso para acceder al dashboard', 403);
    }

    const access = await this.staffRepo.findUserRestaurant(userId, restaurantId);
    if (userRole !== 'admin' && !access) {
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

    return { access, summary, orders: todayOrders, reservations: activeReservations, topItems };
  }

  async updateOrderStatus(userId, orderId, status, statusNote, userRole) {
    const order = await this.orderRepo.findUnique({ id: orderId });
    if (!order) {
      throw new ApplicationError('Orden no encontrada', 404);
    }

    if (userRole === 'admin') {
      return this._doUpdate(orderId, status, statusNote);
    }

    const access = await this.staffRepo.findUserRestaurant(userId, order.restaurant_id);
    if (!access) {
      throw new ApplicationError('No autorizado', 403);
    }

    this._validateStateTransition(order.status, status, access.role);

    if (status === 'cancelled' && (!statusNote || statusNote.trim().length < 3)) {
      throw new ApplicationError('La cancelación requiere un motivo detallado', 400);
    }

    return this._doUpdate(orderId, status, statusNote);
  }

  async _doUpdate(orderId, status, statusNote) {
    return this.orderRepo.update(
      { id: orderId },
      { status, status_note: statusNote || null, updated_at: new Date() }
    );
  }

  _validateStateTransition(currentStatus, newStatus, staffRole) {
    const transitions = STAFF_STATE_MACHINE[staffRole] || STAFF_STATE_MACHINE.staff;
    const allowed = transitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new ApplicationError(
        `Transición no permitida para ${staffRole}: ${currentStatus} → ${newStatus}`,
        403
      );
    }
  }
}

module.exports = new StaffService(staffRepository, orderRepository, statsRepository);
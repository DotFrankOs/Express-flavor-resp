import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';

const MOCK_ASSOCIATIONS = [
  { associationId: 1, role: 'owner', restaurant: { id: 'burgers', name: 'Food Fast Burgers', type: 'burgers', logo: 'foot fast burgers.png', description: 'Hamburguesas artesanales' } }
];

export const staffService = {
  async isStaff() {
    if (apiConfig.useMock) {
      const user = JSON.parse(sessionStorage.getItem('express_flavor_session') || '{}');
      return ['admin', 'test'].includes(user.user);
    }
    try {
      const restaurants = await this.getMyRestaurants();
      return restaurants.length > 0;
    } catch {
      return false;
    }
  },

  async getMyRestaurants() {
    if (apiConfig.useMock) {
      const user = JSON.parse(sessionStorage.getItem('express_flavor_session') || '{}');
      if (user.user === 'admin') return [MOCK_ASSOCIATIONS[0]];
      if (user.user === 'test') return [{ associationId: 2, role: 'manager', restaurant: { id: 'italian', name: 'Italian Taste', type: 'italian', logo: 'Italian Taste.png' } }];
      return [];
    }
    return apiFetch('/staff/restaurants');
  },

  async getDashboard(restaurantId) {
    if (apiConfig.useMock) {
      const now = new Date();
      return {
        restaurantId,
        myRole: 'owner',
        summary: {
          todayOrders: 12,
          todayRevenue: 245.50,
          pendingOrders: 3,
          activeReservations: 5
        },
        orders: [
          {
            id: 'ord_' + Date.now(),
            userId: 'test',
            items: [{ name: 'Burger Clásica', quantity: 2, price: 6.99 }],
            total: 13.98,
            status: 'pending',
            statusNote: null,
            paymentMethod: 'cash',
            deliveryCode: 'A3B7K9',
            createdAt: now.toISOString()
          }
        ],
        reservations: [
          { number: 1, startTime: now.toISOString(), endTime: new Date(now.getTime() + 7200000).toISOString(), code: 'XYZ123', userId: 'test' }
        ],
        topItems: [
          { itemKey: 'b1', count: 45 },
          { itemKey: 'b5', count: 38 }
        ]
      };
    }
    return apiFetch(`/staff/restaurants/${restaurantId}/dashboard`);
  },

  async updateOrderStatus(orderId, status, statusNote = null) {
    if (apiConfig.useMock) {
      return { id: orderId, status, statusNote, updatedAt: new Date().toISOString() };
    }
    return apiFetch(`/staff/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, statusNote })
    });
  } 
};
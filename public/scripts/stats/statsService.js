import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockItemStats } from '../data/mockData.js';
import { authService } from '../auth/authService.js';

const STATS_KEY = 'express_flavor_item_stats';
const ORDERS_KEY = 'express_flavor_orders';

function _loadStats() {
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) {
    localStorage.setItem(STATS_KEY, JSON.stringify(mockItemStats));
    return { ...mockItemStats };
  }
  return JSON.parse(raw);
}

function _saveStats(data) {
  localStorage.setItem(STATS_KEY, JSON.stringify(data));
}

function _loadOrders() {
  const raw = localStorage.getItem(ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function _saveOrders(data) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
}

function _getUser() {
  try {
    const raw = sessionStorage.getItem('express_flavor_session');
    if (raw) return JSON.parse(raw).user;
  } catch {}
  return 'anonymous';
}

function _updateUserOrderCount() {
  const user = authService.getCurrentUser();
  if (!user) return;
  
  const orders = _loadOrders().filter(o => o.userId === user.user);
  const count = orders.length;
  
  const sessionRaw = sessionStorage.getItem('express_flavor_session');
  if (sessionRaw) {
    const session = JSON.parse(sessionRaw);
    session.ordersCount = count;
    sessionStorage.setItem('express_flavor_session', JSON.stringify(session));
  }
  
  const usersRaw = localStorage.getItem('express_flavor_users');
  if (usersRaw) {
    const users = JSON.parse(usersRaw);
    const idx = users.findIndex(u => u.user === user.user);
    if (idx !== -1) {
      users[idx].ordersCount = count;
      localStorage.setItem('express_flavor_users', JSON.stringify(users));
    }
  }
}

function _notifyOrder() {
  document.dispatchEvent(new CustomEvent('order-completed', { bubbles: true }));
}

export const statsService = {
  async recordPurchase(restaurantId, itemId, itemData = {}) {
    if (!restaurantId || !itemId) {
      console.warn('Faltan datos para registrar stat:', { restaurantId, itemId, itemData });
      return;
    }

    const { quantity = 1, variant = null, options = [] } = itemData;
    
    if (apiConfig.useMock) {
      const stats = _loadStats();
      if (!stats[restaurantId]) stats[restaurantId] = {};
      
      if (!stats[restaurantId][itemId]) stats[restaurantId][itemId] = 0;
      stats[restaurantId][itemId] += quantity;
      
      if (variant && variant.variantId) {
        const variantKey = `${itemId}|${variant.variantId}`;
        if (!stats[restaurantId][variantKey]) stats[restaurantId][variantKey] = 0;
        stats[restaurantId][variantKey] += quantity;
      }
      
      _saveStats(stats);
      return stats[restaurantId][itemId];
    }

    return apiFetch(`/stats/purchase`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId, itemId, quantity, variant, options })
    });
  },

  async recordOrder(orderData) {
    const { items, total, restaurantId, restaurantName } = orderData;
    const userId = _getUser();
    
    for (const item of items) {
      const itemId = item.id || item.itemId;
      if (!itemId) {
        console.warn('Item sin ID en orden, no se registra stat:', item);
        continue;
      }
      await this.recordPurchase(restaurantId, itemId, {
        quantity: item.quantity,
        variant: item.variant,
        options: item.options
      });
    }

    if (apiConfig.useMock) {
      const orders = _loadOrders();
      const order = {
        id: `ord_${Date.now()}`,
        userId,
        restaurantId,
        restaurantName,
        items: items.map(item => ({
          itemId: item.id || item.itemId,
          name: item.name,
          baseName: item.baseName || item.name,
          price: item.price,
          basePrice: item.basePrice || item.price,
          quantity: item.quantity,
          variant: item.variant,
          options: item.options,
          image: item.image || null
        })),
        total,
        createdAt: new Date().toISOString()
      };
      orders.unshift(order);
      _saveOrders(orders);

      _updateUserOrderCount();
      _notifyOrder();
      return order;
    }

    const result = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ ...orderData, userId })
    });

    _updateUserOrderCount();
    _notifyOrder();
    return result;
  },

  async getUserOrders() {
    const userId = _getUser();
    
    if (apiConfig.useMock) {
      const orders = _loadOrders();
      return orders.filter(o => o.userId === userId);
    }
    
    return apiFetch(`/orders/user/${userId}`);
  },

  async getStats(restaurantId) {
    if (apiConfig.useMock) {
      const stats = _loadStats();
      return stats[restaurantId] || {};
    }
    return apiFetch(`/stats/restaurants/${restaurantId}`);
  },

  async getTopItems(restaurantId, limit = 5) {
    if (apiConfig.useMock) {
      const stats = _loadStats();
      const restaurantStats = stats[restaurantId] || {};
      const itemTotals = {};
      
      Object.entries(restaurantStats).forEach(([key, count]) => {
        const baseId = key.split('|')[0];
        if (!itemTotals[baseId]) itemTotals[baseId] = 0;
        itemTotals[baseId] += count;
      });
      
      return Object.entries(itemTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([itemId, count]) => ({ itemId, count }));
    }
    return apiFetch(`/stats/restaurants/${restaurantId}/top?limit=${limit}`);
  },

  async getItemCount(restaurantId, itemId) {
    if (apiConfig.useMock) {
      const stats = _loadStats();
      const restaurantStats = stats[restaurantId] || {};
      let total = 0;
      
      Object.entries(restaurantStats).forEach(([key, count]) => {
        if (key === itemId || key.startsWith(`${itemId}|`)) {
          total += count;
        }
      });
      
      return total;
    }
    return apiFetch(`/stats/restaurants/${restaurantId}/items/${itemId}`);
  },

  async getVariantStats(restaurantId, itemId) {
    if (apiConfig.useMock) {
      const stats = _loadStats();
      const restaurantStats = stats[restaurantId] || {};
      const variants = [];
      
      Object.entries(restaurantStats).forEach(([key, count]) => {
        if (key.startsWith(`${itemId}|`)) {
          const variantId = key.split('|')[1];
          variants.push({ variantId, count });
        }
      });
      
      return variants.sort((a, b) => b.count - a.count);
    }
    return apiFetch(`/stats/restaurants/${restaurantId}/items/${itemId}/variants`);
  },

  async enrichItemsWithStats(restaurantId, items) {
    const stats = await this.getStats(restaurantId);
    return items.map(item => {
      const totalCount = Object.entries(stats)
        .filter(([key]) => key === item.id || key.startsWith(`${item.id}|`))
        .reduce((sum, [, count]) => sum + count, 0);
      
      return {
        ...item,
        purchaseCount: totalCount
      };
    });
  }
};
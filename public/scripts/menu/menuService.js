import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockMenus } from '../data/mockData.js';

export const menuService = {
  async getMenu(restaurantId) {
    if (apiConfig.useMock) {
      return mockMenus[restaurantId] ? [...mockMenus[restaurantId]] : [];
    }
    return apiFetch(`/restaurants/${restaurantId}/menu`);
  },
  
  async createItem(restaurantId, itemData) {
    return apiFetch(`/restaurants/${restaurantId}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  async updateItem(restaurantId, itemId, itemData) {
    return apiFetch(`/restaurants/${restaurantId}/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(itemData)
    });
  },

  async toggleItem(restaurantId, itemId) {
    return apiFetch(`/restaurants/${restaurantId}/menu/items/${itemId}/toggle`, {
      method: 'PATCH'
    });
  },

  async deleteItem(restaurantId, itemId) {
    return apiFetch(`/restaurants/${restaurantId}/menu/items/${itemId}`, {
      method: 'DELETE'
    });
  },

  async getAllMenu(restaurantId) {
    if (apiConfig.useMock) {
      return mockMenus[restaurantId] ? [...mockMenus[restaurantId]] : [];
    }
    return apiFetch(`/restaurants/${restaurantId}/menu/all`);
  }
};
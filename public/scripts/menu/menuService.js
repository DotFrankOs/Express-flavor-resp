import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockMenus } from '../data/mockData.js';

export const menuService = {
  async getMenu(restaurantId) {
    if (apiConfig.useMock) {
      return mockMenus[restaurantId] ? [...mockMenus[restaurantId]] : [];
    }
    return apiFetch(`/restaurants/${restaurantId}/menu`);
  }
};
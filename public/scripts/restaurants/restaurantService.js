import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockRestaurants } from '../data/mockData.js';

export const restaurantService = {
  async getAll() {
    if (apiConfig.useMock) {
      return [...mockRestaurants];
    }
    return apiFetch('/restaurants');
  },

  async getById(id) {
    if (apiConfig.useMock) {
      const found = mockRestaurants.find(r => r.id === id);
      return found ? { ...found } : null;
    }
    return apiFetch(`/restaurants/${id}`);
  }
};
import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockTables } from '../data/mockData.js';

export const tableService = {
  async getTables(restaurantId) {
    if (apiConfig.useMock) {
      const config = mockTables[restaurantId];
      return config ? [...config.items] : [];
    }
    return apiFetch(`/restaurants/${restaurantId}/tables`);
  },

  async getLayout(restaurantId) {
    if (apiConfig.useMock) {
      const config = mockTables[restaurantId];
      return config ? { ...config.layout } : { columns: 5, gap: '10px' };
    }
    return apiFetch(`/restaurants/${restaurantId}/tables/layout`);
  }
};

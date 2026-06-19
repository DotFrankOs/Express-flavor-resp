import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockTables } from '../data/mockData.js';

const TABLE_PRICING_MOCK = {
  standard: 0,
  bar: 0,
  terraza: 2.00,
  vip: 5.00
};

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
  },

  async getPricing(restaurantId) {
    if (apiConfig.useMock) {
      const config = mockTables[restaurantId];
      if (!config) return { pricing: {}, styles: {} };
      
      const pricing = {};
      const styles = {};
      config.items.forEach(table => {
        const style = table.style || 'standard';
        styles[table.id] = style;
        pricing[table.id] = TABLE_PRICING_MOCK[style] || 0;
      });
      return { pricing, styles };
    }
    return apiFetch(`/restaurants/${restaurantId}/tables/pricing`);
  },

  getPriceForStyle(style) {
    return TABLE_PRICING_MOCK[style] || 0;
  }
};
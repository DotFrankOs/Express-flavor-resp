import { tableService } from '../tables/tableService.js';
import { mockTables } from '../data/mockData.js';

const DEFAULT_TABLE_COUNT = 15;

export const tableConfigService = {
  _configs: new Map(),

  async register(restaurantId, config) {
    this._configs.set(restaurantId, config);
  },

  async getConfig(restaurantId) {
    const cached = this._configs.get(restaurantId);
    if (cached) {
      return cached;
    }
    
    try {
      const tables = await tableService.getTables(restaurantId);
      const layout = await tableService.getLayout(restaurantId);
      const config = { layout, tables };
      this._configs.set(restaurantId, config);
      return config;
    } catch (e) {
      const mock = mockTables[restaurantId];
      if (mock) {
        const config = { layout: { ...mock.layout }, tables: [...mock.items] };
        this._configs.set(restaurantId, config);
        return config;
      }
      return this._generateDefault(restaurantId);
    }
},

  async getTables(restaurantId) {
    return (await this.getConfig(restaurantId)).tables;
  },

  async getLayout(restaurantId) {
    return (await this.getConfig(restaurantId)).layout || { columns: 5, gap: '10px' };
  },

  _generateDefault(restaurantId) {
    return {
      layout: { columns: 5, gap: '10px' },
      tables: Array.from({ length: DEFAULT_TABLE_COUNT }, (_, i) => ({
        id: i + 1,
        name: `Mesa ${i + 1}`,
        label: `${i + 1}`,
        style: 'standard'
      }))
    };
  }
};

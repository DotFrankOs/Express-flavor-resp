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
      const { pricing, styles } = await tableService.getPricing(restaurantId);
      const config = { layout, tables, pricing, styles };
      this._configs.set(restaurantId, config);
      return config;
    } catch (e) {
      const mock = mockTables[restaurantId];
      if (mock) {
        const pricing = {};
        const styles = {};
        mock.items.forEach(table => {
          const style = table.style || 'standard';
          styles[table.id] = style;
          pricing[table.id] = tableService.getPriceForStyle(style);
        });
        const config = { layout: { ...mock.layout }, tables: [...mock.items], pricing, styles };
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

  async getPricing(restaurantId) {
    return (await this.getConfig(restaurantId)).pricing || {};
  },

  async getStyles(restaurantId) {
    return (await this.getConfig(restaurantId)).styles || {};
  },

  getTablePrice(restaurantId, tableId) {
    const config = this._configs.get(restaurantId);
    if (!config || !config.pricing) return 0;
    return config.pricing[tableId] || 0;
  },

  getTableStyle(restaurantId, tableId) {
    const config = this._configs.get(restaurantId);
    if (!config || !config.styles) return 'standard';
    return config.styles[tableId] || 'standard';
  },

  _generateDefault(restaurantId) {
    const tables = Array.from({ length: DEFAULT_TABLE_COUNT }, (_, i) => ({
      id: i + 1,
      name: `Mesa ${i + 1}`,
      label: `${i + 1}`,
      style: 'standard'
    }));
    const pricing = {};
    const styles = {};
    tables.forEach(t => {
      pricing[t.id] = 0;
      styles[t.id] = 'standard';
    });
    return {
      layout: { columns: 5, gap: '10px' },
      tables,
      pricing,
      styles
    };
  }
};
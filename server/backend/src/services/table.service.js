const { tableRepository } = require('../repositories');

const TABLE_PRICING = {
  standard: 0,
  bar: 0,
  terraza: 2.00,
  vip: 5.00
};

class TableService {
  constructor(repo) {
    this.repo = repo;
  }

  async getTablesByRestaurantId(restaurantId) {
    return this.repo.findByRestaurantId(restaurantId);
  }

  async getLayoutByRestaurantId(restaurantId) {
    return this.repo.findLayoutByRestaurantId(restaurantId);
  }

  async getPricingByRestaurantId(restaurantId) {
    const tables = await this.repo.findByRestaurantId(restaurantId);
    const pricing = {};
    tables.forEach(table => {
      pricing[table.id] = TABLE_PRICING[table.style] || TABLE_PRICING.standard;
    });
    return {
      pricing,
      styles: tables.reduce((acc, t) => {
        acc[t.id] = t.style || 'standard';
        return acc;
      }, {})
    };
  }
}

module.exports = new TableService(tableRepository);
module.exports.TABLE_PRICING = TABLE_PRICING;
const { tableRepository } = require('../repositories');

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
}

module.exports = new TableService(tableRepository);
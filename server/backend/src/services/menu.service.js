const { menuRepository } = require('../repositories');

class MenuService {
  constructor(repo) {
    this.repo = repo;
  }

  async getMenuByRestaurantId(restaurantId) {
    return this.repo.findByRestaurantId(restaurantId);
  }
}

module.exports = new MenuService(menuRepository);
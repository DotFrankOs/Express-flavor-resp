const { restaurantRepository } = require('../repositories');
const { AppError } = require('../utils/prisma-error-handler.utils');

class RestaurantService {
  constructor(repo) {
    this.repo = repo;
  }

  async getAll() {
    return this.repo.findMany();
  }

  async getById(id) {
    const restaurant = await this.repo.findUnique({ id });
    if (!restaurant) {
      throw new AppError('Restaurante no encontrado', 404);
    }
    return restaurant;
  }
}

module.exports = new RestaurantService(restaurantRepository);
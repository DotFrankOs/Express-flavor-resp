const { cartRepository } = require('../repositories');
const { AppError } = require('../utils/prisma-error-handler.utils');

class CartService {
  constructor(repo) {
    this.repo = repo;
  }

  async getCart(userId) {
    return this.repo.findByUserId(userId);
  }

  async saveCart(userId, items, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new AppError('No autorizado', 403);
    }

    await this.repo.replaceAllForUser(userId, items);
    return items;
  }

  async clearCart(userId, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new AppError('No autorizado', 403);
    }

    await this.repo.deleteMany({ user_id: userId });
    return { success: true };
  }
}

module.exports = new CartService(cartRepository);
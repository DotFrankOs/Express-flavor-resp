const { statsRepository } = require('../repositories');

class StatsService {
  constructor(repo) {
    this.repo = repo;
  }

  async recordPurchase(restaurantId, itemId, quantity, variant) {
    const qty = quantity || 1;

    await this.repo.recordStat(restaurantId, itemId, qty);

    if (variant?.variantId) {
      const key = `${itemId}|${variant.variantId}`;
      await this.repo.recordStat(restaurantId, key, qty);
    }

    return { success: true };
  }

  async getStats(restaurantId) {
    return this.repo.findByRestaurantId(restaurantId);
  }

  async getTop(restaurantId, limit = 5) {
    return this.repo.findTopByRestaurantId(restaurantId, limit);
  }

  async getItemCount(restaurantId, itemId) {
    return this.repo.findItemAndVariants(restaurantId, itemId);
  }

  async getVariants(restaurantId, itemId) {
    return this.repo.findVariants(restaurantId, itemId);
  }
}

module.exports = new StatsService(statsRepository);
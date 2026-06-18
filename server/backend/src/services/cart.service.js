const { cartRepository } = require('../repositories');
const ApplicationError = require('../domain/errors/application-error');
const { generateCartItemId } = require('../utils/id-generator.utils');

class CartService {
  constructor(repo) {
    this.repo = repo;
  }

  async getCart(userId) {
    return this.repo.findByUserId(userId);
  }

  async saveCart(userId, items, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }
    const normalizedItems = items.map(item => this._normalizeCartItem(item, userId));
    await this.repo.replaceAllForUser(userId, normalizedItems);
    return normalizedItems;
  }

  async addItem(userId, itemData, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }

    const items = await this.repo.findByUserId(userId) || [];
    const newSignature = this._generateSignature(itemData);

    const existingIndex = items.findIndex(i => {
      const existingSignature = this._generateSignature(i);
      return existingSignature === newSignature && i.restaurant_id === itemData.restaurantId;
    });

    if (existingIndex !== -1) {
      items[existingIndex].quantity = (items[existingIndex].quantity || 1) + (itemData.quantity || 1);
      items[existingIndex].price = itemData.price;
      items[existingIndex].base_price = itemData.basePrice || itemData.price;
    } else {
      items.push(this._normalizeCartItem(itemData, userId));
    }

    await this.repo.replaceAllForUser(userId, items);
    return items;
  }

  async updateQuantity(userId, itemId, quantity, authenticatedUserId) {
    if (userId !== authenticatedUserId) throw new ApplicationError('No autorizado', 403);
    if (quantity <= 0) return this.removeItem(userId, itemId, authenticatedUserId);

    const items = await this.repo.findByUserId(userId);
    const item = items.find(i => i.id === itemId);
    if (!item) throw new ApplicationError('Item no encontrado en el carrito', 404);

    item.quantity = quantity;
    await this.repo.replaceAllForUser(userId, items);
    return items;
  }

  async removeItem(userId, itemId, authenticatedUserId) {
    if (userId !== authenticatedUserId) throw new ApplicationError('No autorizado', 403);
    const items = await this.repo.findByUserId(userId);
    const filtered = items.filter(i => i.id !== itemId);
    await this.repo.replaceAllForUser(userId, filtered);
    return filtered;
  }

  async clearCart(userId, authenticatedUserId) {
    if (userId !== authenticatedUserId) throw new ApplicationError('No autorizado', 403);
    await this.repo.deleteMany({ user_id: userId });
    return { success: true };
  }

  _normalizeCartItem(item, userId) {
    return {
      id: item.id || generateCartItemId(item, userId),
      user_id: userId,
      name: item.name,
      base_name: item.baseName || item.base_name || item.name,
      price: item.price ? parseFloat(item.price) : 0,
      base_price: item.basePrice || item.base_price || (item.price ? parseFloat(item.price) : 0),
      restaurant_id: item.restaurantId || item.restaurant_id,
      restaurant_name: item.restaurantName || item.restaurant_name,
      quantity: item.quantity || 1,
      variant: item.variant || null,
      options: item.options || [],
      image: item.image || null
    };
  }

  _generateSignature(item) {
    const optionsSig = (item.options || [])
      .map(o => o.choiceId || o.choice_id)
      .sort()
      .join('|');
    const variantSig = item.variant ? (item.variant.variantId || item.variant.variant_id || '') : '';
    const productKey = item.baseName || item.base_name || item.name || '';
    return `${productKey}_${item.restaurantId || item.restaurant_id}_${variantSig}_${optionsSig}`;
  }
}

module.exports = new CartService(cartRepository);
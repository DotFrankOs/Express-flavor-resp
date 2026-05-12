import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { normalizeImageUrl } from '../utils/imageHelper.js';

const CART_PREFIX = 'express_flavor_cart_';
const MAX_AGE_DAYS = 7;

function _getUser() {
  try {
    const raw = sessionStorage.getItem('express_flavor_session');
    if (raw) return JSON.parse(raw).user;
  } catch {}
  return 'guest';
}

function _key() {
  return `${CART_PREFIX}${_getUser()}`;
}

function _load() {
  const raw = localStorage.getItem(_key());
  if (!raw) return { items: [], updatedAt: null };
  try {
    const cart = JSON.parse(raw);
    return cart.items && Array.isArray(cart.items) ? cart : { items: [], updatedAt: null };
  } catch {
    return { items: [], updatedAt: null };
  }
}

function _save(cart) {
  cart.updatedAt = new Date().toISOString();
  localStorage.setItem(_key(), JSON.stringify(cart));
  _notify(); // ← NUEVO
}

function _notify() {
  document.dispatchEvent(new CustomEvent('cart-updated', { bubbles: true }));
}

export const cartService = {
  async getCart() {
    if (apiConfig.useMock) {
      return _load();
    }
    return apiFetch(`/cart/${_getUser()}`);
  },

  async saveCart(cart) {
    cart.updatedAt = new Date().toISOString();
    if (apiConfig.useMock) {
      _save(cart);
      return cart;
    }
    const result = await apiFetch(`/cart/${_getUser()}`, {
      method: 'PUT',
      body: JSON.stringify(cart)
    });
    _notify();
    return result;
  },

  async clearCart() {
    if (apiConfig.useMock) {
      localStorage.removeItem(_key());
      _notify();
      return;
    }
    await apiFetch(`/cart/${_getUser()}`, { method: 'DELETE' });
    _notify();
  },

  async addItem(item) {
    const cart = await this.getCart();
    if (!cart.items) cart.items = [];

    const optionsSig = (item.options || [])
      .map(o => o.choiceId)
      .sort()
      .join('|');
    const variantSig = item.variant ? item.variant.variantId : '';
    const signature = `${item.id || item.name}_${variantSig}_${optionsSig}`;

    const existing = cart.items.find(i => {
      const iOptionsSig = (i.options || [])
        .map(o => o.choiceId)
        .sort()
        .join('|');
      const iVariantSig = i.variant ? i.variant.variantId : '';
      const iSignature = `${i.id || i.name}_${iVariantSig}_${iOptionsSig}`;
      return iSignature === signature && i.restaurantId === item.restaurantId;
    });

    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.items.push({
      id: item.id || `${item.restaurantId}_${item.name}_${Date.now()}`,
      name: item.name,
      baseName: item.baseName || item.name,
      price: Number(item.price),
      basePrice: item.basePrice || Number(item.price),
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName,
      quantity: item.quantity || 1,
      variant: item.variant || null,
      options: item.options || [],
      image: item.image || null
    });
    }
    return this.saveCart(cart);
  },

  async removeItem(itemId) {
    const cart = await this.getCart();
    cart.items = cart.items.filter(i => i.id !== itemId);
    return this.saveCart(cart);
  },

  async updateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    const cart = await this.getCart();
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      return this.saveCart(cart);
    }
  },

  async getTotal() {
    const cart = await this.getCart();
    return (cart.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  async getCount() {
    const cart = await this.getCart();
    return (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);
  },

  async getGrouped() {
    const cart = await this.getCart();
    const items = cart.items || [];
    const groups = {};
    items.forEach(item => {
      const key = item.restaurantId || 'general';
      if (!groups[key]) {
        groups[key] = {
          restaurantId: key,
          restaurantName: item.restaurantName || 'Restaurante',
          items: []
        };
      }
      groups[key].items.push(item);
    });
    return Object.values(groups);
  },

  cleanupOldCarts() {
    const now = new Date();
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(CART_PREFIX)) return;
      try {
        const cart = JSON.parse(localStorage.getItem(key));
        if (cart.updatedAt) {
          const days = (now - new Date(cart.updatedAt)) / (1000 * 60 * 60 * 24);
          if (days > MAX_AGE_DAYS) localStorage.removeItem(key);
        }
      } catch {}
    });
  }
};
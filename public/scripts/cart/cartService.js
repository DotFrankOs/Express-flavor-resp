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
  _notify();
}

function _notify() {
  document.dispatchEvent(new CustomEvent('cart-updated', { bubbles: true }));
}

export const cartService = {
  async getCart() {
    let cart;
    if (apiConfig.useMock) {
        cart = _load();
    } else {
        cart = await apiFetch(`/cart/${_getUser()}`);
    }
    
    return cart || { items: [], updatedAt: null };
},

  async saveCart(cart) {
    if (cart.items) {
        cart.items = cart.items.map((item, idx) => {
            const normalized = {
                id: item.id,
                name: item.name,
                baseName: item.baseName || item.base_name || item.name,
                price: Number(item.price),
                basePrice: item.basePrice || item.base_price || Number(item.price),
                restaurantId: item.restaurantId || item.restaurant_id,
                restaurantName: item.restaurantName || item.restaurant_name,
                quantity: item.quantity || 1,
                variant: item.variant || null,
                options: item.options || [],
                image: item.image || null
            };
            return normalized;
        });
    }
    
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

    const normalizedItem = {
      id: item.id,
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
    };

    if (!normalizedItem.restaurantId || !normalizedItem.restaurantName) {
      throw new Error('El item debe tener restaurantId y restaurantName');
    }

    const optionsSig = (normalizedItem.options || [])
      .map(o => o.choiceId)
      .sort()
      .join('|');
    const variantSig = normalizedItem.variant ? normalizedItem.variant.variantId : '';
    const signature = `${normalizedItem.id || normalizedItem.name}_${variantSig}_${optionsSig}`;

    const existing = cart.items.find(i => {
      const iOptionsSig = (i.options || [])
        .map(o => o.choiceId)
        .sort()
        .join('|');
      const iVariantSig = i.variant ? i.variant.variantId : '';
      const iSignature = `${i.id || i.name}_${iVariantSig}_${iOptionsSig}`;
      return iSignature === signature && i.restaurantId === normalizedItem.restaurantId;
    });

    if (existing) {
        existing.quantity += normalizedItem.quantity || 1;
        existing.restaurantId = existing.restaurantId || normalizedItem.restaurantId;
        existing.restaurantName = existing.restaurantName || normalizedItem.restaurantName;
    } else {
      cart.items.push(normalizedItem);
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
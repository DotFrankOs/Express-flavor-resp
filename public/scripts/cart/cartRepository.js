const CART_PREFIX = 'express_flavor_cart_';
const MAX_AGE_DAYS = 7;

export const cartRepository = {
    _key(username) {
        return `${CART_PREFIX}${username}`;
    },

    getCart(username) {
        const raw = localStorage.getItem(this._key(username));
        if (!raw) return { items: [], updatedAt: null };
        try {
            const cart = JSON.parse(raw);
            return cart.items && Array.isArray(cart.items) ? cart : { items: [], updatedAt: null };
        } catch {
            return { items: [], updatedAt: null };
        }
    },

    saveCart(username, cart) {
        cart.updatedAt = new Date().toISOString();
        localStorage.setItem(this._key(username), JSON.stringify(cart));
    },

    clearCart(username) {
        localStorage.removeItem(this._key(username));
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
            } catch {
            }
        });
    }
};
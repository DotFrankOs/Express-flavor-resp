import { cartService } from '../scripts/cart/cartService.js';
import { currencyService } from '../scripts/currency/currencyService.js';
import { statsService } from '../scripts/stats/statsService.js';

class CartComponent extends HTMLElement {
  constructor() {
    super();
    this.currentRestaurantId = this.getAttribute('restaurant-id') || '';
    this.currentRestaurantName = this.getAttribute('restaurant-name') || '';
    this._cart = { items: [] };
  }

  async connectedCallback() {
    await this._loadCart();
    this.render();
    
    this._boundAddToCart = async (e) => {
        await cartService.addItem({
            name: e.detail.name,
            price: e.detail.price,
            restaurantId: e.detail.restaurantId,
            restaurantName: e.detail.restaurantName,
            quantity: 1,
            variant: e.detail.variant,
            options: e.detail.options,
            image: e.detail.image
        });
        await this._loadCart();
        this.render();
    };
    document.addEventListener('add-to-cart', this._boundAddToCart);
    
    this.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const itemId = btn.dataset.id;

        if (action === 'remove') {
            await cartService.removeItem(itemId);
        } else if (action === 'increase') {
            const item = this._cart.items.find(i => i.id === itemId);
            if (item) await cartService.updateQuantity(itemId, item.quantity + 1);
        } else if (action === 'decrease') {
            const item = this._cart.items.find(i => i.id === itemId);
            if (item) await cartService.updateQuantity(itemId, item.quantity - 1);
        } else if (action === 'buy') {
            await this.handleBuy();
            return;
        } else if (action === 'clear') {
            if (confirm('¿Vaciar carrito?')) {
                await cartService.clearCart();
            }
        }
        
        await this._loadCart();
        this.render();
    });
  }

  disconnectedCallback() {
    document.removeEventListener('add-to-cart', this._boundAddToCart);
  }

  async _loadCart() {
    this._cart = await cartService.getCart();
  }

  async handleBuy() {
    await this._loadCart();
    const items = this._cart.items || [];
    if (items.length === 0) return alert('Tu carrito está vacío.');

    const grouped = await cartService.getGrouped();

    let message = '🛒 Resumen de compra:\n\n';
    grouped.forEach(group => {
      message += `📍 ${group.restaurantName}\n`;
      group.items.forEach(item => {
        const subtotal = item.price * item.quantity;
        let line = `   • ${item.name} x${item.quantity} = ${currencyService.formatPrice(subtotal)}`;
        if (item.options && item.options.length > 0) {
          line += `\n     (${item.options.map(o => o.choiceName).join(', ')})`;
        }
        message += line + '\n';
      });
      message += '\n';
    });
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `💰 Total: ${currencyService.formatPrice(total)}`;

    if (confirm(message + '\n\n¿Confirmar compra?')) {
      try {
        for (const group of grouped) {
          await statsService.recordOrder({
            restaurantId: group.restaurantId,
            restaurantName: group.restaurantName,
            items: group.items,
            total: group.items.reduce((s, i) => s + (i.price * i.quantity), 0)
          });
        }
      } catch (err) {
        console.error('Error registrando stats:', err);
      }
      
      alert('¡Compra realizada con éxito!');
      await cartService.clearCart();
      await this._loadCart();
      this.render();
    }
  }

  async getGroupedItems() {
    const grouped = await cartService.getGrouped();

    if (this.currentRestaurantId) {
      grouped.sort((a, b) => {
        if (a.restaurantId === this.currentRestaurantId) return -1;
        if (b.restaurantId === this.currentRestaurantId) return 1;
        return 0;
      });
    }

    return grouped;
  }

  async render() {
    await this._loadCart();
    const grouped = await this.getGroupedItems();
    const total = (this._cart.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = (this._cart.items || []).reduce((sum, item) => sum + item.quantity, 0);

    const itemsHtml = grouped.map(group => `
      <div class="cart-restaurant-group" data-restaurant="${group.restaurantId}">
        <h5 class="restaurant-label">🍽️ ${group.restaurantName}</h5>
        ${group.items.map(item => `
          <li class="cart-item" data-id="${item.id}">
            <div class="item-info">
              <span class="item-name">${item.name}</span>
              ${item.options && item.options.length > 0 ? `
                <span class="item-options" style="font-size:0.75rem;color:#666;display:block;">
                  ${item.options.map(o => `+ ${o.choiceName}`).join(', ')}
                </span>
              ` : ''}
              <span class="item-unit-price" style="font-size:0.75rem;color:#888;">
                ${currencyService.formatPrice(item.price)} c/u
              </span>
              <span class="item-price">${currencyService.formatPrice(item.price * item.quantity)}</span>
            </div>
            <div class="item-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
              <button class="remove-btn" data-action="remove" data-id="${item.id}">🗑️</button>
            </div>
          </li>
        `).join('')}
      </div>
    `).join('');

    this.innerHTML = `
      <div class="cart-container">
        <div class="cart-header">
          <h3>🛒 Carrito ${count > 0 ? `<span class="cart-badge">${count}</span>` : ''}</h3>
          ${count > 0 ? `<button class="clear-btn" data-action="clear">Vaciar</button>` : ''}
        </div>

        ${grouped.length === 0 ? 
          '<p class="cart-empty">Tu carrito está vacío</p>' : 
          `<ul class="cart-list">${itemsHtml}</ul>`
        }

        <div class="cart-footer">
          <p class="cart-total">Total: <strong>${currencyService.formatPrice(total)}</strong></p>
          <button class="buy-btn" data-action="buy" ${count === 0 ? 'disabled' : ''}>
            Comprar
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('global-cart', CartComponent);
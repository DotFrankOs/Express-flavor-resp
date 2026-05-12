import { authService } from '../scripts/auth/authService.js';
import { cartService } from '../scripts/cart/cartService.js';
import { currencyService } from '../scripts/currency/currencyService.js';
import { reservationService } from '../scripts/reservation/reservationService.js';
import { statsService } from '../scripts/stats/statsService.js';

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this._user = null;
    this._cart = { items: [] };
    this._reservations = [];
    this._orders = [];
  }

  async connectedCallback() {
  try {
      this._user = authService.getCurrentUser();
      await currencyService.init();
      await this._loadData();
      this.render();
      this._attachEvents();
      
      this._boundRefreshCart = () => this._refreshCart();
      document.addEventListener('cart-updated', this._boundRefreshCart);
      
      this._boundOrderCompleted = () => this._refreshOrders();
      document.addEventListener('order-completed', this._boundOrderCompleted);
    } catch (err) {
      console.error('Error inicializando app-header:', err);
    }
  }

  async _loadData() {
    this._cart = await cartService.getCart();
    if (this._user) {
      this._reservations = await reservationService.getUserReservations();
      this._orders = await statsService.getUserOrders();
    }
  }

  async _refreshCart() {
    this._cart = await cartService.getCart();
    this._renderCartDropdown();
    const count = await cartService.getCount();
    this._updateBadge('cart-badge', count);
  }

  async _refreshOrders() {
    if (!this._user) return;
    this._orders = await statsService.getUserOrders();
    this._renderReservationsDropdown();
    this._renderProfileDropdown();
    
    const now = new Date();
    const upcoming = this._reservations.filter(r => new Date(r.endTime) > now);
    this._updateBadge('reservations-badge', upcoming.length);
  }

  _updateBadge(id, count) {
    const el = this.querySelector(`#${id}`);
    if (!el) return;
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  _attachEvents() {
    const toggles = [
      { btn: '#cart-toggle', panel: '#cart-panel' },
      { btn: '#reservations-toggle', panel: '#reservations-panel' },
      { btn: '#profile-toggle', panel: '#profile-panel' }
    ];

    toggles.forEach(({ btn, panel }) => {
      const button = this.querySelector(btn);
      const dropdown = this.querySelector(panel);
      if (!button || !dropdown) return;

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        this.querySelectorAll('.ah-dropdown-panel').forEach(d => d.classList.remove('open'));
        if (!isOpen) dropdown.classList.add('open');
      });
    });

    document.addEventListener('click', () => {
      this.querySelectorAll('.ah-dropdown-panel').forEach(d => d.classList.remove('open'));
    });

    this.querySelector('#header-logout')?.addEventListener('click', () => authService.logout());
  }

  disconnectedCallback() {
    document.removeEventListener('cart-updated', this._boundRefreshCart);
    document.removeEventListener('order-completed', this._boundOrderCompleted);
  }

  _renderCartDropdown() {
    const panel = this.querySelector('#cart-panel');
    if (!panel) return;
    const items = this._cart.items || [];
    const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);

    if (items.length === 0) {
      panel.innerHTML = `
        <div class="ah-dropdown-empty">
          <img src="images/svg/cart-empty.svg" alt="Carrito vacío" class="ah-empty-icon">
          Tu carrito está vacío
        </div>
        <a href="cart.html" class="ah-dropdown-link">Ver carrito completo →</a>
      `;
      return;
    }

    const itemsHtml = items.slice(0, 4).map(item => `
      <div class="ah-dropdown-item">
        <div class="ah-dropdown-item-main">
          <span class="ah-dropdown-item-name">${item.name}</span>
          <span class="ah-dropdown-item-qty">x${item.quantity}</span>
        </div>
        <div class="ah-dropdown-item-meta">
          ${item.restaurantName || ''} · ${currencyService.formatPrice(item.price * item.quantity)}
        </div>
      </div>
    `).join('');

    const more = items.length > 4 ? `<div class="ah-dropdown-more">+${items.length - 4} productos más</div>` : '';

    panel.innerHTML = `
      <div class="ah-dropdown-title">Tu pedido (${count})</div>
      ${itemsHtml}
      ${more}
      <div class="ah-dropdown-total">Total: <strong>${currencyService.formatPrice(total)}</strong></div>
      <a href="cart.html" class="ah-dropdown-btn">Ver carrito completo</a>
    `;

    this._updateBadge('cart-badge', count);
  }

  _renderReservationsDropdown() {
    const panel = this.querySelector('#reservations-panel');
    if (!panel) return;
    const now = new Date();
    const upcoming = this._reservations.filter(r => new Date(r.endTime) > now);
    this._updateBadge('reservations-badge', upcoming.length);

    if (upcoming.length === 0) {
      panel.innerHTML = `
        <div class="ah-dropdown-empty">
          <img src="images/svg/calendar-empty.svg" alt="Sin reservas" class="ah-empty-icon">
          No tenés reservas activas
        </div>
      `;
      return;
    }

    const itemsHtml = upcoming.slice(0, 5).map(r => {
      const start = new Date(r.startTime);
      const dateStr = start.toLocaleDateString();
      const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="ah-dropdown-item">
          <div class="ah-dropdown-item-main">
            <span class="ah-dropdown-item-name">Mesa ${r.number}</span>
            <span class="ah-dropdown-item-tag">${r.restaurantName}</span>
          </div>
          <div class="ah-dropdown-item-meta">
            ${dateStr} · ${timeStr} · Código: <strong>${r.code}</strong>
          </div>
        </div>
      `;
    }).join('');

    panel.innerHTML = `
      <div class="ah-dropdown-title">Tus reservas</div>
      ${itemsHtml}
    `;
  }

  _renderProfileDropdown() {
    const panel = this.querySelector('#profile-panel');
    if (!panel || !this._user) return;

    const avatar = this._user.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this._user.name)}&background=random`;

    this.querySelector('#header-avatar').src = avatar;
    this.querySelector('#header-name').textContent = this._user.name;

    // Stats reales: Pedidos = órdenes, Compras = total items, Favoritos = favoritos
    const totalItemsBought = this._orders.reduce((sum, o) => 
      sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    
    const recentOrders = this._orders.slice(0, 5);
    let itemsHtml = '';
    
    if (recentOrders.length > 0) {
      const allItems = recentOrders.flatMap(order => 
        order.items.map(item => ({
          ...item,
          restaurantName: order.restaurantName,
          orderDate: order.createdAt
        }))
      ).slice(0, 5);

      itemsHtml = `
        <div class="ah-profile-orders">
          <div class="ah-profile-section-title">
            <img src="images/svg/recent-orders.svg" alt="Últimos" class="ah-section-icon">
            Últimos productos
          </div>
          ${allItems.map(item => {
            const date = new Date(item.orderDate).toLocaleDateString();
            let name = item.baseName || item.name;
            let variantHtml = '';
            if (item.variant) {
              variantHtml = `<span class="ah-variant-tag">${item.variant.variantName}</span>`;
              name = item.baseName || item.name;
            }
            return `
              <div class="ah-dropdown-item ah-order-item">
                <div class="ah-dropdown-item-main">
                  <span class="ah-dropdown-item-name">${name} ${variantHtml}</span>
                  <span class="ah-dropdown-item-qty">x${item.quantity}</span>
                </div>
                <div class="ah-dropdown-item-meta">
                  ${item.restaurantName} · ${date}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="ah-profile-header">
        <img src="${avatar}" alt="" class="ah-profile-avatar-lg">
        <div>
          <div class="ah-profile-name">${this._user.name}</div>
          <div class="ah-profile-email">${this._user.email || ''}</div>
        </div>
      </div>
      <div class="ah-profile-stats">
        <div>
          <strong>${this._orders.length}</strong>
          <span>Pedidos</span>
        </div>
        <div>
          <strong>${(this._user.favorites || []).length}</strong>
          <span>Favoritos</span>
        </div>
        <div>
          <strong>${totalItemsBought}</strong>
          <span>Compras</span>
        </div>
      </div>
      ${itemsHtml}
      <a href="orders.html" class="ah-dropdown-btn" style="margin-bottom:8px;text-align:center;display:block;text-decoration:none;">
        <img src="images/svg/orders-icon.svg" alt="Órdenes" class="ah-btn-icon">
        Ver todos mis pedidos
      </a>
      <button id="header-logout" class="ah-dropdown-btn ah-secondary">Cerrar sesión</button>
    `;
  }

  render() {
    const avatar = this._user?.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this._user?.name || 'U')}&background=random`;

    this.innerHTML = `
      <div class="ah-wrapper">
        <div class="ah-inner">
          <a href="restaurantes.html" class="ah-brand">
            <img src="logo.png" alt="Logo" class="ah-brand-logo" onerror="this.style.display='none'">
            <div class="ah-brand-text">
              <span class="ah-brand-title">Express Flavor</span>
              <span class="ah-brand-sub">Sabor express, experiencia única</span>
            </div>
          </a>

          <div class="ah-actions">
            <div class="ah-dropdown">
              <button class="ah-btn" id="cart-toggle" title="Tu carrito">
                <img src="images/svg/cart-icon.svg" alt="Carrito" class="ah-btn-icon">
                <span class="ah-btn-label">Carrito</span>
                <span class="ah-badge" id="cart-badge">0</span>
              </button>
              <div class="ah-dropdown-panel" id="cart-panel">
                <div class="ah-dropdown-empty">Cargando...</div>
              </div>
            </div>

            <div class="ah-dropdown">
              <button class="ah-btn" id="reservations-toggle" title="Tus reservas">
                <img src="images/svg/calendar-icon.svg" alt="Reservas" class="ah-btn-icon">
                <span class="ah-btn-label">Reservas</span>
                <span class="ah-badge" id="reservations-badge">0</span>
              </button>
              <div class="ah-dropdown-panel" id="reservations-panel">
                <div class="ah-dropdown-empty">Cargando...</div>
              </div>
            </div>

            <div class="ah-dropdown">
              <button class="ah-btn" id="profile-toggle">
                <img id="header-avatar" src="${avatar}" alt="" class="ah-profile-img">
                <span class="ah-btn-label" id="header-name">${this._user?.name || 'Invitado'}</span>
              </button>
              <div class="ah-dropdown-panel" id="profile-panel">
                <div class="ah-dropdown-empty">Cargando...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._renderCartDropdown();
    this._renderReservationsDropdown();
    this._renderProfileDropdown();
  }
}

customElements.define('app-header', AppHeader);
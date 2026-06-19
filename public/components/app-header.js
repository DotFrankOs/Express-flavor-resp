import { authService } from '../scripts/auth/authService.js';
import { cartService } from '../scripts/cart/cartService.js';
import { currencyService } from '../scripts/currency/currencyService.js';
import { reservationService } from '../scripts/reservation/reservationService.js';
import { statsService } from '../scripts/stats/statsService.js';
import { getRoleLabel } from '../scripts/utils/translator.js'

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this._user = null;
    this._isStaff = false;
    this._cart = { items: [] };
    this._reservations = [];
    this._orders = [];
  }

  async connectedCallback() {
    try {
      this._user = authService.getCurrentUser();
      this._isStaff = await authService.isStaff();
      await currencyService.init();
      await this._loadData();
      this.render();
      this._attachEvents();
      
      this._boundRefreshCart = () => this._refreshCart();
      document.addEventListener('cart-updated', this._boundRefreshCart);
      
      this._boundOrderCompleted = () => this._refreshOrders();
      this._boundRefreshReservations = () => this._refreshReservations();
      document.addEventListener('reservations-updated', this._boundRefreshReservations);
      document.addEventListener('order-completed', this._boundOrderCompleted);

      this._boundHandlePageShow = (e) => {
        if (e.persisted) {
          this._refreshAll();
        }
      };
      window.addEventListener('pageshow', this._boundHandlePageShow);

      this._boundHandleVisibility = () => {
        if (document.visibilityState === 'visible') {
          this._refreshAll();
        }
      };
      document.addEventListener('visibilitychange', this._boundHandleVisibility);

    } catch (err) {
      console.error('Error inicializando app-header:', err);
    }
  }

  async _refreshAll() {
    await this._loadData();
    this._renderCartDropdown();
    this._renderReservationsDropdown();
    this._renderProfileDropdown();
    
    const avatar = this._user?.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this._user?.name || 'U')}&background=random`;
    const avatarEl = this.querySelector('#header-avatar');
    if (avatarEl) avatarEl.src = avatar;
    
    const nameEl = this.querySelector('#header-name');
    if (nameEl) nameEl.textContent = this._user?.name || 'Invitado';
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
    this._reservations = await reservationService.getUserReservations();
    this._renderReservationsDropdown();
    this._renderProfileDropdown();
    
    const now = new Date();
    const upcoming = this._reservations.filter(r => new Date(r.endTime) > now && r.status !== 'cancelled');
    this._updateBadge('reservations-badge', upcoming.length);
  }

  async _refreshReservations() {
    if (!this._user) return;
    this._reservations = await reservationService.getUserReservations();
    this._renderReservationsDropdown();
    this._renderProfileDropdown();
    
    const now = new Date();
    const upcoming = this._reservations.filter(r => new Date(r.endTime) > now && r.status !== 'cancelled');
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

    this.addEventListener('change', (e) => {
      if (e.target.id === 'header-currency-selector') {
        e.stopPropagation();
        const newCurrency = e.target.value;
        currencyService.setCurrency(newCurrency);
        window.location.reload();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.ah-dropdown-panel')) return;
      
      if (e.target.closest('.ah-btn')) return;
      
      if (e.target.tagName === 'SELECT') return;
      
      this.querySelectorAll('.ah-dropdown-panel').forEach(d => d.classList.remove('open'));
    });

    this.querySelector('#header-logout')?.addEventListener('click', () => authService.logout());
  }

  disconnectedCallback() {
    document.removeEventListener('cart-updated', this._boundRefreshCart);
    document.removeEventListener('order-completed', this._boundOrderCompleted);
    document.removeEventListener('reservations-updated', this._boundRefreshReservations);
    window.removeEventListener('pageshow', this._boundHandlePageShow);
    document.removeEventListener('visibilitychange', this._boundHandleVisibility);
  }

  _renderCurrencySelector() {
    const currencies = currencyService.getAvailableCurrencies();
    const current = currencyService.getCurrency();

    return `
      <div class="ah-currency-section" onclick="event.stopPropagation()">
        <div class="ah-profile-section-title">
          <img src="images/svg/money-icon.svg" alt="Moneda" class="ah-section-icon">
          Moneda
        </div>
        <select id="header-currency-selector" class="ah-currency-select">
          ${currencies.map(c => `
            <option value="${c.code}" ${c.code === current ? 'selected' : ''}>
              ${c.symbol} ${c.code}
            </option>
          `).join('')}
        </select>
      </div>
    `;
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
    
    const sortedReservations = [...this._reservations].sort((a, b) => {
      const aEnd = new Date(a.endTime);
      const bEnd = new Date(b.endTime);
      const aActive = aEnd > now && a.status !== 'cancelled';
      const bActive = bEnd > now && b.status !== 'cancelled';
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(a.startTime) - new Date(b.startTime);
    });
    
    const activeCount = sortedReservations.filter(r => {
      const end = new Date(r.endTime);
      return end > now && r.status !== 'cancelled';
    }).length;
    
    this._updateBadge('reservations-badge', activeCount);

    if (sortedReservations.length === 0) {
      panel.innerHTML = `
        <div class="ah-dropdown-empty">
          <img src="images/svg/calendar-empty.svg" alt="Sin reservas" class="ah-empty-icon">
          No tenés reservas
        </div>
        <a href="restaurantes.html" class="ah-dropdown-btn" style="margin-top:12px;text-align:center;display:block;text-decoration:none;">
          <img src="images/svg/store-icon.svg" alt="" class="ah-btn-icon">
          Hacer una reserva
        </a>
      `;
      return;
    }

    const recentReservations = sortedReservations.slice(0, 3);
    
    const itemsHtml = recentReservations.map(r => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const isActive = end > now && r.status !== 'cancelled';
      const isPast = end < now && r.status !== 'cancelled';
      const isCancelled = r.status === 'cancelled';
      
      const dateStr = start.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
      const timeStr = start.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const durationMs = end - start;
      const durationHours = Math.round(durationMs / (1000 * 60 * 60));
      
      let statusDot = '';
      let statusColor = '';
      if (isActive) {
        statusDot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:6px;"></span>';
        statusColor = 'color:#7dbd7d;';
      } else if (isPast) {
        statusDot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#6b7280;margin-right:6px;"></span>';
        statusColor = 'color:#9ca3af;';
      } else if (isCancelled) {
        statusDot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;margin-right:6px;"></span>';
        statusColor = 'color:#e0a0a0;';
      }
      
      const price = r.price || 0;
      const priceText = price > 0 ? currencyService.formatPrice(price) : 'Gratis';
      
      return `
        <div class="ah-dropdown-item">
          <div class="ah-dropdown-item-main">
            <span class="ah-dropdown-item-name">
              ${statusDot}
              Mesa ${r.number}
            </span>
            <span class="ah-dropdown-item-tag" style="font-size:0.7rem;background:${isActive ? 'rgba(34,197,94,0.15)' : isPast ? 'rgba(107,114,128,0.15)' : 'rgba(239,68,68,0.15)'};color:${isActive ? '#7dbd7d' : isPast ? '#9ca3af' : '#e0a0a0'};padding:2px 8px;border-radius:10px;">
              ${isActive ? 'Activa' : isPast ? 'Finalizada' : 'Cancelada'}
            </span>
          </div>
          <div class="ah-dropdown-item-meta" style="${statusColor}">
            ${r.restaurantName || ''} · ${dateStr} · ${timeStr}
          </div>
          <div class="ah-dropdown-item-meta" style="color: #2e7d32; font-weight: 600; margin-top: 2px; font-size: 0.8rem;">
            ${priceText} · ${durationHours}h
          </div>
        </div>
      `;
    }).join('');

    const moreCount = sortedReservations.length - 3;
    const moreText = moreCount > 0 ? `<div class="ah-dropdown-more">+${moreCount} reserva${moreCount > 1 ? 's' : ''} más</div>` : '';

    panel.innerHTML = `
      <div class="ah-dropdown-title">Tus reservas (${activeCount} activa${activeCount !== 1 ? 's' : ''})</div>
      ${itemsHtml}
      ${moreText}
      <a href="reservations.html" class="ah-dropdown-btn" style="margin-top:14px;text-align:center;display:block;text-decoration:none;">
        <img src="images/svg/calendar-icon.svg" alt="Reservas" class="ah-btn-icon">
        Ver todas mis reservas
      </a>
    `;
  }

  _renderProfileDropdown() {
    const panel = this.querySelector('#profile-panel');
    if (!panel || !this._user) return;

    const avatar = this._user.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this._user.name)}&background=random`;

    this.querySelector('#header-avatar').src = avatar;
    this.querySelector('#header-name').textContent = this._user.name;

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
    const currencySelector = this._renderCurrencySelector();
    const staffLink = this._isStaff ? `
      <a href="staff-dashboard.html" class="ah-dropdown-btn ah-staff-link" style="margin-bottom:8px;text-align:center;display:block;text-decoration:none;background:linear-gradient(135deg,#8B4513,#A0522D);border-color:#D2691E;color:#f5e6d3;">
        <img src="images/svg/staff-icon.svg" alt="Staff" class="ah-btn-icon" style="filter:brightness(0)invert(1);">
        Panel de Staff
      </a>
    ` : '';

    const roleLabel = getRoleLabel(this._user.role);

        panel.innerHTML = `
          <div class="ah-profile-header">
            <img src="${avatar}" alt="" class="ah-profile-avatar-lg">
            <div>
              <div class="ah-profile-name">${this._user.name}</div>
              <div class="ah-profile-email">${this._user.email || ''}</div>
              <div class="ah-profile-role" data-role="${this._user.role || 'customer'}">${roleLabel}</div>
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
          ${currencySelector}
          ${staffLink}
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

    const staffButton = this._isStaff ? `
      <a href="staff-dashboard.html" class="ah-btn ah-staff-btn" title="Panel de Staff">
        <img src="images/svg/staff-icon.svg" alt="Staff" class="ah-btn-icon">
        <span class="ah-btn-label">Staff</span>
      </a>
    ` : '';

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
            ${staffButton}

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
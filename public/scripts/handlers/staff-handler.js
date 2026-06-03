import { authService } from '../auth/authService.js';
import { staffService } from '../staff/staffService.js';
import { currencyService } from '../currency/currencyService.js';
import { alertService } from '../alert/alertService.js';
import { restaurantService } from '../restaurants/restaurantService.js';
import { menuService } from '../menu/menuService.js';
import { getRoleLabel } from '../utils/translator.js';

function getRestaurantIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('restaurant') || '';
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

let currentDashboard = null;
let selectedOrderId = null;
let selectedStatus = null;

async function loadDashboard() {
  const restaurantId = getRestaurantIdFromUrl();
  
  if (restaurantId) {
    document.body.classList.add(`restaurant-${restaurantId}`);
  }
  
  if (!restaurantId) {
    const myRestaurants = await staffService.getMyRestaurants();
    if (myRestaurants.length > 0) {
      window.location.href = `staff-dashboard.html?restaurant=${myRestaurants[0].restaurant.id}`;
    } else {
      alertService.show('No tienes acceso a ningún restaurante', 'error');
    }
    return;
  }

  try {
    currentDashboard = await staffService.getDashboard(restaurantId);
    
    const restaurant = await restaurantService.getById(restaurantId);
    
    document.getElementById('restaurant-name').textContent = restaurant?.name || currentDashboard.restaurantId;
    document.getElementById('staff-role').textContent = getRoleLabel(currentDashboard.myRole);
    
    const logoEl = document.getElementById('restaurant-logo');
    if (restaurant?.logo) {
      logoEl.src = restaurant.logo;
      logoEl.alt = `Logo ${restaurant.name}`;
      logoEl.style.display = '';
    } else {
      logoEl.style.display = 'none';
    }

    document.getElementById('stat-today-orders').textContent = currentDashboard.summary.todayOrders;
    document.getElementById('stat-today-revenue').textContent = 
      currencyService.formatPrice(currentDashboard.summary.todayRevenue);
    document.getElementById('stat-pending').textContent = currentDashboard.summary.pendingOrders;
    document.getElementById('stat-reservations').textContent = currentDashboard.summary.activeReservations;

    renderOrders(currentDashboard.orders);
    renderReservations(currentDashboard.reservations);
    await renderTopItems(currentDashboard.topItems);

  } catch (err) {
    console.error('Error cargando dashboard:', err);
    alertService.show('Error al cargar el panel', 'error');
  }
}

function renderOrders(orders, filter = 'all') {
  const container = document.getElementById('orders-list');
  
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="staff-empty">
        <img src="images/svg/empty-orders.svg" alt="" class="empty-icon">
        <p>No hay pedidos ${filter !== 'all' ? 'en este estado' : ''}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const statusLabels = {
      pending: 'Pendiente',
      processing: 'En preparación',
      delivering: 'En camino',
      delivered: 'Entregado',
      issue: 'Inconveniente'
    };

    const itemsHtml = order.items.map(item => `
      <div class="staff-order-item">
        <span>${item.name} x${item.quantity}</span>
        <span>${currencyService.formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');

    const paymentHtml = order.paymentMethod === 'cash' ? `
      <span class="delivery-code-display" style="font-size:0.75rem;padding:2px 8px;">
        <img src="images/svg/cash-code-icon.svg" alt="" class="payment-badge-icon"> ${order.deliveryCode}
      </span>
    ` : '<span style="font-size:0.75rem;color:#8a7a6a;"><img src="images/svg/card-icon.svg" alt="" class="payment-badge-icon"> Tarjeta</span>';

    return `
      <div class="staff-order-card" data-order-id="${order.id}">
        <div class="staff-order-header">
          <div>
            <div class="staff-order-id">#${order.id.slice(-6).toUpperCase()}</div>
            <div class="staff-order-time">${formatTime(order.createdAt)}</div>
          </div>
          <span class="order-status ${order.status}">${statusLabels[order.status]}</span>
        </div>
        
        <div class="staff-order-items">
          ${itemsHtml}
        </div>
        
        <div class="staff-order-footer">
          <div>
            ${paymentHtml}
            <span style="font-weight:700;color:#f5e6d3;margin-left:12px;">${currencyService.formatPrice(order.total)}</span>
          </div>
          <div class="staff-order-actions">
            <button class="btn-status btn-status-change" data-action="change-status" data-order="${order.id}">
              Cambiar estado
            </button>
          </div>
        </div>
        
        ${order.statusNote ? `
          <div class="status-note" style="margin-top:10px;">
            <img src="images/svg/alert-triangle-icon.svg" alt="" class="status-note-icon"> ${order.statusNote}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="change-status"]').forEach(btn => {
    btn.addEventListener('click', () => openStatusModal(btn.dataset.order));
  });
}

function renderReservations(reservations) {
  const container = document.getElementById('reservations-list');
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (reservations.length === 0) {
    container.innerHTML = `
      <div class="staff-empty">
        <img src="images/svg/calendar-empty.svg" alt="" class="empty-icon">
        <p>No hay reservas activas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reservations.map(r => `
    <div class="staff-reservation-card">
      <div class="reservation-table">Mesa ${r.number}</div>
      <div class="reservation-code">${r.code}</div>
      <div class="reservation-time">
        <img src="images/svg/clock-icon.svg" alt="" class="timeline-icon"> ${formatTime(r.startTime)} - ${formatTime(r.endTime)}
      </div>
    </div>
  `).join('');
}

async function renderTopItems(topItems) {
  const container = document.getElementById('top-items-list');
  
  if (topItems.length === 0) {
    container.innerHTML = '<p class="staff-empty">No hay datos suficientes</p>';
    return;
  }

  const restaurantId = getRestaurantIdFromUrl();
  let menuItems = [];
  
  try {
    menuItems = await menuService.getMenu(restaurantId);
  } catch (e) {
    console.warn('No se pudo cargar el menú para estadísticas:', e);
  }

  const rankClasses = ['gold', 'silver', 'bronze', ''];

  container.innerHTML = topItems.map((item, idx) => {
    const menuItem = menuItems.find(m => m.id === item.itemKey);
    const displayName = menuItem?.name || item.itemKey;
    const displayImage = menuItem?.image ? `
      <img src="${menuItem.image}" alt="${displayName}" class="top-item-img" onerror="this.style.display='none'">
    ` : '<div class="top-item-img" style="display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);color:#8a7a6a;font-size:1.2rem;font-weight:700;">' + displayName.charAt(0) + '</div>';

    return `
      <div class="top-item-row">
        <div class="top-item-rank ${rankClasses[idx] || ''}">${idx + 1}</div>
        ${displayImage}
        <div class="top-item-info">
          <div class="top-item-name">${displayName}</div>
          ${menuItem?.description ? `<div class="top-item-desc">${menuItem.description.substring(0, 60)}${menuItem.description.length > 60 ? '...' : ''}</div>` : ''}
        </div>
        <div class="top-item-count">${item.count} vendidos</div>
      </div>
    `;
  }).join('');
}

function openStatusModal(orderId) {
  selectedOrderId = orderId;
  selectedStatus = null;
  
  const order = currentDashboard.orders.find(o => o.id === orderId);
  document.getElementById('status-order-info').textContent = `Pedido #${orderId.slice(-6).toUpperCase()}`;
  
  document.querySelectorAll('.status-option').forEach(opt => {
    opt.classList.remove('selected');
    if (opt.dataset.status === order.status) {
      opt.classList.add('selected');
      selectedStatus = order.status;
    }
  });
  
  document.getElementById('issue-note-group').style.display = 'none';
  document.getElementById('issue-note').value = '';
  
  const modal = document.getElementById('status-modal');
  modal.style.display = 'flex';
  modal.offsetHeight;
}

function closeStatusModal() {
  const modal = document.getElementById('status-modal');
  modal.style.display = 'none';
  selectedOrderId = null;
  selectedStatus = null;
}

async function saveStatusChange() {
  if (!selectedOrderId || !selectedStatus) return;
  
  const note = selectedStatus === 'issue' ? document.getElementById('issue-note').value : null;
  
  try {
    await staffService.updateOrderStatus(selectedOrderId, selectedStatus, note);
    
    const order = currentDashboard.orders.find(o => o.id === selectedOrderId);
    if (order) {
      order.status = selectedStatus;
      order.statusNote = note;
    }
    
    renderOrders(currentDashboard.orders, document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    closeStatusModal();
    
    document.getElementById('stat-pending').textContent = 
      currentDashboard.orders.filter(o => o.status === 'pending').length;
      
  } catch (err) {
    alertService.show('Error al actualizar estado', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!authService.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const isStaff = await authService.isStaff();
  if (!isStaff) {
    alertService.show('No tienes permisos para acceder al panel de staff', 'error');
    setTimeout(() => {
      window.location.href = 'restaurantes.html';
    }, 1500);
    return;
  }

  await currencyService.init();
  await loadDashboard();

  document.querySelectorAll('.staff-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.staff-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.staff-tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderOrders(currentDashboard.orders, btn.dataset.filter);
    });
  });

  document.querySelectorAll('.status-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedStatus = opt.dataset.status;
      
      document.getElementById('issue-note-group').style.display = 
        selectedStatus === 'issue' ? 'block' : 'none';
    });
  });

  document.getElementById('confirm-status-btn').addEventListener('click', saveStatusChange);
  document.getElementById('cancel-status-btn').addEventListener('click', closeStatusModal);

  document.getElementById('status-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeStatusModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeStatusModal();
  });
});
import { authService } from '../auth/authService.js';
import { statsService } from '../stats/statsService.js';
import { currencyService } from '../currency/currencyService.js';
import { mockRestaurants } from '../data/mockData.js';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: 'clock-icon.svg' },
  processing: { label: 'En preparación', icon: 'chef-icon.svg' },
  delivering: { label: 'En camino', icon: 'truck-icon.svg' },
  delivered: { label: 'Entregado', icon: 'check-circle-icon.svg' },
  issue: { label: 'Inconveniente', icon: 'alert-triangle-icon.svg' }
};

const STATUS_FLOW = ['pending', 'processing', 'delivering', 'delivered'];

const PAYMENT_ICONS = {
  card: 'card-icon.svg',
  cash: 'cash-icon.svg'
};

document.addEventListener('DOMContentLoaded', async () => {
  await currencyService.init();
  
  const ordersList = document.getElementById('orders-list');
  const statTotalOrders = document.getElementById('stat-total-orders');
  const statTotalItems = document.getElementById('stat-total-items');
  const statTotalSpent = document.getElementById('stat-total-spent');

  if (!authService.isLoggedIn()) {
    if (ordersList) {
      ordersList.innerHTML = `
        <div class="order-empty">
          <img src="images/svg/lock-icon.svg" alt="Inicia sesión" class="order-empty-icon locked">
          <h3>Inicia sesión para ver tus pedidos</h3>
          <a href="index.html" class="btn-primary">Ir al login</a>
        </div>
      `;
    }
    return;
  }

  try {
    const orders = await statsService.getUserOrders();
    
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, o) => 
      sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    
    statTotalOrders.textContent = totalOrders;
    statTotalItems.textContent = totalItems;
    statTotalSpent.textContent = currencyService.formatPrice(totalSpent);

    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="order-empty">
          <img src="images/svg/empty-orders.svg" alt="Sin pedidos" class="order-empty-icon">
          <h3>Aún no has realizado pedidos</h3>
          <p>Tus compras aparecerán aquí cuando hagas tu primer pedido.</p>
          <a href="restaurantes.html" class="btn-primary">Explorar restaurantes</a>
        </div>
      `;
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const restaurant = mockRestaurants.find(r => r.id === order.restaurantId);
      const logo = restaurant ? restaurant.logo : '';
      const hasLogo = logo && logo.trim() !== '';

      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
      const paymentIcon = PAYMENT_ICONS[order.paymentMethod] || PAYMENT_ICONS.card;
      const isCash = order.paymentMethod === 'cash';

      const currentStepIndex = STATUS_FLOW.indexOf(order.status);
      const timelineHtml = order.status !== 'issue' ? `
        <div class="status-timeline">
          ${STATUS_FLOW.map((step, idx) => {
            const stepConfig = STATUS_CONFIG[step];
            let stepClass = '';
            if (idx < currentStepIndex) stepClass = 'completed';
            else if (idx === currentStepIndex) stepClass = 'active';
            return `
              <div class="timeline-step ${stepClass}">
                <div class="timeline-dot"></div>
                <span class="timeline-label">${stepConfig.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : '';

      const itemsHtml = order.items.map(item => {
        let displayName = item.baseName || item.name;
        let variantHtml = '';
        let optionsHtml = '';
        
        if (item.variant) {
          variantHtml = `<span class="order-item-variant">${item.variant.variantName}</span>`;
        }
        
        if (item.options && item.options.length > 0) {
          optionsHtml = `
            <div class="order-item-options">
              ${item.options.map(o => `+ ${o.choiceName}`).join(', ')}
            </div>
          `;
        }

        const hasImage = item.image && item.image.trim() !== '';

        return `
          <div class="order-item">
            ${hasImage 
              ? `<img src="${item.image}" alt="${displayName}" class="order-item-img" onerror="this.parentElement.querySelector('.order-img-fallback').style.display='flex';this.style.display='none'">
                 <div class="order-img-fallback" style="display:none;width:64px;height:64px;border-radius:10px;background:#2a1d12;align-items:center;justify-content:center;color:#5a4a3a;font-size:1.5rem;flex-shrink:0;">
                   <img src="images/svg/food-icon.svg" alt="" style="width:32px;height:32px;opacity:0.4;">
                 </div>`
              : `<div class="order-img-fallback" style="width:64px;height:64px;border-radius:10px;background:#2a1d12;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                   <img src="images/svg/food-icon.svg" alt="" style="width:32px;height:32px;opacity:0.4;">
                 </div>`
            }
            <div class="order-item-info">
              <div class="order-item-name">
                ${displayName} ${variantHtml}
              </div>
              ${optionsHtml}
              <div style="font-size:0.85rem;color:#8a7a6a;margin-top:4px;">
                Cantidad: ${item.quantity}
              </div>
            </div>
            <div class="order-item-price">
              ${currencyService.formatPrice(item.price * item.quantity)}
            </div>
          </div>
        `;
      }).join('');

      const paymentHtml = `
        <div class="order-payment-info">
          <span class="payment-badge ${order.paymentMethod || 'card'}">
            <img src="images/svg/${paymentIcon}" alt="" style="width:14px;height:14px;">
            ${isCash ? 'Efectivo' : 'Tarjeta'}
          </span>
          ${isCash && order.deliveryCode ? `
            <span class="delivery-code-display">
              <img src="images/svg/key-icon.svg" alt="" style="width:14px;height:14px;">
              ${order.deliveryCode}
            </span>
          ` : ''}
        </div>
      `;

      const issueNoteHtml = order.status === 'issue' && order.statusNote ? `
        <div class="status-note">
          <img src="images/svg/alert-triangle-icon.svg" alt="" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
          ${order.statusNote}
        </div>
      ` : '';

      return `
        <div class="order-card" data-order-id="${order.id}">
          <div class="order-header">
            <div style="display:flex;align-items:center;gap:10px;">
              ${hasLogo 
                ? `<img src="${logo}" alt="${order.restaurantName}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid rgba(117,86,60,0.5);background:#2a1d12;">` 
                : '<img src="images/svg/store-icon.svg" alt="" style="width:32px;height:32px;opacity:0.5;">'
              }
              <div>
                <h3 style="margin:0;color:#f5e6d3;">${order.restaurantName}</h3>
                <div class="order-date">${dateStr} · ${timeStr}</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              <span class="order-status ${order.status || 'pending'}">
                ${statusConfig.label}
              </span>
              <span style="font-size:0.75rem;color:#8a7a6a;">#${order.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
          
          ${timelineHtml}
          ${issueNoteHtml}
          
          <div class="order-body">
            ${itemsHtml}
          </div>
          
          <div class="order-footer">
            <span class="order-total-label">
              ${order.items.reduce((s,i)=>s+i.quantity,0)} producto${order.items.reduce((s,i)=>s+i.quantity,0) > 1 ? 's' : ''}
            </span>
            <span class="order-total-value">
              ${currencyService.formatPrice(order.total)}
            </span>
          </div>
          
          ${paymentHtml}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error cargando pedidos:', err);
    ordersList.innerHTML = `
      <div class="order-empty">
        <img src="images/svg/warning-icon.svg" alt="Error" class="order-empty-icon">
        <h3>Error al cargar pedidos</h3>
        <p>Intenta recargar la página.</p>
      </div>
    `;
  }
});
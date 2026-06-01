import { authService } from '../auth/authService.js';
import { statsService } from '../stats/statsService.js';
import { currencyService } from '../currency/currencyService.js';
import { mockRestaurants } from '../data/mockData.js';

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
                 <div class="order-img-fallback" style="display:none;width:64px;height:64px;border-radius:10px;background:#eee;align-items:center;justify-content:center;color:#aaa;font-size:1.5rem;flex-shrink:0;">🍽️</div>`
              : `<div class="order-img-fallback" style="width:64px;height:64px;border-radius:10px;background:#eee;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:1.5rem;flex-shrink:0;">🍽️</div>`
            }
            <div class="order-item-info">
              <div class="order-item-name">
                ${displayName} ${variantHtml}
              </div>
              ${optionsHtml}
              <div style="font-size:0.85rem;color:#888;margin-top:4px;">
                Cantidad: ${item.quantity}
              </div>
            </div>
            <div class="order-item-price">
              ${currencyService.formatPrice(item.price * item.quantity)}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="order-card">
          <div class="order-header">
            <div style="display:flex;align-items:center;gap:10px;">
              ${hasLogo 
                ? `<img src="${logo}" alt="${order.restaurantName}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);background:#fff;">` 
                : '🍽️'
              }
              <div>
                <h3 style="margin:0;">${order.restaurantName}</h3>
                <div class="order-date">${dateStr} · ${timeStr}</div>
              </div>
            </div>
            <div style="font-size:0.85rem;opacity:0.9;">
              #${order.id.slice(-6).toUpperCase()}
            </div>
          </div>
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
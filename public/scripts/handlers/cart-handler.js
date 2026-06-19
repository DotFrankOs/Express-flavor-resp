import { authService } from '../auth/authService.js';
import { cartService } from '../cart/cartService.js';
import { currencyService } from '../currency/currencyService.js';
import { statsService } from '../stats/statsService.js';
import { alertService } from '../alert/alertService.js';
import { restaurantService } from '../restaurants/restaurantService.js';
import { mockRestaurants } from '../data/mockData.js';

function generateDeliveryCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatCardNumber(value) {
  return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
}

function formatExpiry(value) {
  const v = value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2);
  return v;
}

let currentCart = { items: [] };
let selectedPayment = 'card';
let restaurantLogos = {};

async function loadRestaurantLogos() {
  try {
    const restaurants = await restaurantService.getAll();
    restaurants.forEach(r => {
      restaurantLogos[r.id] = r.logo;
    });
  } catch (e) {
    mockRestaurants.forEach(r => {
      restaurantLogos[r.id] = r.logo;
    });
  }
}

function getRestaurantLogo(restaurantId) {
  return restaurantLogos[restaurantId] || '';
}

async function renderCart() {
  const container = document.getElementById('cart-items-container');
  currentCart = await cartService.getCart();
  const items = currentCart.items || [];

  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) {
    clearBtn.style.display = items.length > 0 ? 'flex' : 'none';
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <img src="images/svg/cart-empty.svg" alt="" class="cart-empty-icon">
        <h3>Tu carrito está vacío</h3>
        <p>Agrega productos de nuestros restaurantes</p>
        <a href="restaurantes.html" class="checkout-btn" style="display:inline-block;text-decoration:none;width:auto;padding:12px 32px;">
          Explorar restaurantes
        </a>
      </div>
    `;
    updateSummary(0);
    document.getElementById('checkout-btn').disabled = true;
    return;
  }

  const itemsHtml = await Promise.all(items.map(async (item) => {
    const subtotal = item.price * item.quantity;
    const logo = getRestaurantLogo(item.restaurantId);
    const hasLogo = logo && logo.trim() !== '';
    
    let optionsText = '';
    if (item.options && item.options.length > 0) {
      optionsText = item.options.map(o => `+ ${o.choiceName}`).join(', ');
    }

    return `
      <div class="cart-item-card" data-id="${item.id}">
        ${item.image 
          ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="cart-item-img-fallback" style="display:none">
               <img src="images/svg/food-icon.svg" alt="">
             </div>`
          : `<div class="cart-item-img-fallback">
               <img src="images/svg/food-icon.svg" alt="">
             </div>`
        }
        <div class="cart-item-details">
          <div>
            <div class="cart-item-header">
              <div>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-restaurant">
                  ${hasLogo 
                    ? `<img src="${logo}" alt="${item.restaurantName}" class="restaurant-logo-sm" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                       <div class="restaurant-logo-fallback" style="display:none">
                         <img src="images/svg/store-icon.svg" alt="">
                       </div>`
                    : `<div class="restaurant-logo-fallback">
                         <img src="images/svg/store-icon.svg" alt="">
                       </div>`
                  }
                  <span class="restaurant-name-text">${item.restaurantName}</span>
                </div>
                ${item.variant ? `
                  <span class="cart-item-variant">
                    <img src="images/svg/variant-icon.svg" alt="" style="width:12px;height:12px;">
                    ${item.variant.variantName}
                  </span>` : ''}
                ${optionsText ? `<div class="cart-item-options">${optionsText}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="cart-item-footer">
            <div>
              <div class="cart-item-price">${currencyService.formatPrice(subtotal)}</div>
              <div class="cart-item-unit">${currencyService.formatPrice(item.price)} c/u</div>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
              <button class="remove-btn" data-action="remove" data-id="${item.id}" title="Eliminar">
                <img src="images/svg/trash-icon.svg" alt="Eliminar">
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }));

  container.innerHTML = `<div class="cart-items-list">${itemsHtml.join('')}</div>`;
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  updateSummary(total);
  document.getElementById('checkout-btn').disabled = false;
  
  attachItemEvents();
}
document.dispatchEvent(new CustomEvent('cart-updated'));

function updateSummary(total) {
  document.getElementById('summary-subtotal').textContent = currencyService.formatPrice(total);
  document.getElementById('summary-total').textContent = currencyService.formatPrice(total);
  document.getElementById('card-amount').textContent = currencyService.formatPrice(total);
}

function attachItemEvents() {
  document.querySelectorAll('.qty-btn, .remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const action = e.currentTarget.dataset.action;
      const itemId = e.currentTarget.dataset.id;

      if (action === 'remove') {
        if (!await alertService.confirm('¿Eliminar este producto del carrito?')) return;
        await cartService.removeItem(itemId);
      } else if (action === 'increase') {
        const item = currentCart.items.find(i => i.id === itemId);
        if (item) await cartService.updateQuantity(itemId, item.quantity + 1);
      } else if (action === 'decrease') {
        const item = currentCart.items.find(i => i.id === itemId);
        if (item) {
          if (item.quantity <= 1) {
            if (!await alertService.confirm('¿Eliminar este producto?')) return;
            await cartService.removeItem(itemId);
          } else {
            await cartService.updateQuantity(itemId, item.quantity - 1);
          }
        }
      }

      await renderCart();
      document.dispatchEvent(new CustomEvent('cart-updated', { bubbles: true }));
    });
  });
}

async function handleClearAll() {
  const items = currentCart.items || [];
  if (items.length === 0) return;
  
  const confirmed = await alertService.confirm(
    `¿Vaciar todo el carrito? Se eliminarán ${items.reduce((s, i) => s + i.quantity, 0)} productos.`
  );
  
  if (!confirmed) return;
  
  await cartService.clearCart();
  await renderCart();
  document.dispatchEvent(new CustomEvent('cart-updated', { bubbles: true }));
}

async function handleCheckout() {
  const items = currentCart.items || [];
  if (items.length === 0) return;

  const grouped = await cartService.getGrouped();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (selectedPayment === 'card') {
    showCardModal(total);
  } else {
    await processCashOrder(grouped, total);
  }
}

function showCardModal(total) {
  document.getElementById('card-amount').textContent = currencyService.formatPrice(total);
  document.getElementById('card-modal').style.display = 'flex';
}

function hideCardModal() {
  document.getElementById('card-modal').style.display = 'none';
  document.getElementById('card-number').value = '';
  document.getElementById('card-expiry').value = '';
  document.getElementById('card-cvv').value = '';
  document.getElementById('card-name').value = '';
}

async function processCardPayment(grouped, total) {
  const btn = document.getElementById('confirm-card-btn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<img src="images/svg/spinner-icon.svg" alt="" class="btn-icon-sm" style="animation:spin 1s linear infinite;"> Procesando...`;

  await new Promise(r => setTimeout(r, 1500));

  btn.disabled = false;
  btn.innerHTML = originalText;
  hideCardModal();

  await createOrders(grouped, total, 'card', null);
}

async function processCashOrder(grouped, total) {
  const deliveryCode = generateDeliveryCode();
  await createOrders(grouped, total, 'cash', deliveryCode);
}

async function createOrders(grouped, total, paymentMethod, deliveryCode) {
  try {
    for (const group of grouped) {
      const cleanItems = group.items.map(item => ({
        id: item.id,
        name: item.name,
        baseName: item.baseName || item.name,
        price: item.price,
        basePrice: item.basePrice || item.price,
        quantity: item.quantity,
        variant: item.variant || undefined,
        options: item.options || [],
        image: item.image || null
      }));

      const orderData = {
        restaurantId: group.restaurantId,
        restaurantName: group.restaurantName,
        items: cleanItems,
        total: group.items.reduce((s, i) => s + (i.price * i.quantity), 0),
        paymentMethod
      };

      await statsService.recordOrder(orderData);
    }

    await cartService.clearCart();
    showSuccessModal(paymentMethod, deliveryCode);
    
    document.dispatchEvent(new CustomEvent('cart-updated', { bubbles: true }));
    document.dispatchEvent(new CustomEvent('order-completed', { bubbles: true }));
  } catch (err) {
    console.error('Error en checkout:', err);
    alertService.show('Hubo un error al procesar tu pedido. Intenta de nuevo.', 'error');
  }
}

function showSuccessModal(paymentMethod, deliveryCode) {
  const modal = document.getElementById('success-modal');
  const cashSection = document.getElementById('cash-code-section');
  const codeEl = document.getElementById('delivery-code');
  const msgEl = document.getElementById('success-message');

  if (paymentMethod === 'cash') {
    msgEl.textContent = 'Tu pedido está confirmado. Paga al recibir.';
    cashSection.style.display = 'block';
    codeEl.textContent = deliveryCode;
  } else {
    msgEl.textContent = 'Pago procesado correctamente. Tu pedido está en camino.';
    cashSection.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function hideSuccessModal() {
  document.getElementById('success-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!authService.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  await currencyService.init();
  await loadRestaurantLogos();
  await renderCart();

  document.getElementById('clear-all-btn')?.addEventListener('click', handleClearAll);

  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedPayment = opt.dataset.method;
    });
  });

  document.getElementById('checkout-btn').addEventListener('click', handleCheckout);

  document.getElementById('confirm-card-btn').addEventListener('click', async () => {
    const grouped = await cartService.getGrouped();
    const total = currentCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await processCardPayment(grouped, total);
  });

  document.getElementById('cancel-card-btn').addEventListener('click', hideCardModal);

  document.getElementById('card-number').addEventListener('input', (e) => {
    e.target.value = formatCardNumber(e.target.value);
  });

  document.getElementById('card-expiry').addEventListener('input', (e) => {
    e.target.value = formatExpiry(e.target.value);
  });

  document.getElementById('view-orders-btn').addEventListener('click', () => {
    window.location.href = 'orders.html';
  });

  document.getElementById('close-success-btn').addEventListener('click', () => {
    hideSuccessModal();
    window.location.href = 'restaurantes.html';
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'success-modal') {
        overlay.style.display = 'none';
      }
    });
  });
});
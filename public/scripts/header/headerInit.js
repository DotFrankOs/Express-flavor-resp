import { authService } from '../auth/authService.js';
import { cartService } from '../cart/cartService.js';
import { currencyService } from '../currency/currencyService.js';

export async function initHeader() {
  const user = authService.getCurrentUser();
  
  if (user) {
    const avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
    document.getElementById('profileAvatar').src = avatar;
    document.getElementById('dropdownAvatar').src = avatar;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('dropdownName').textContent = user.name;
    document.getElementById('dropdownEmail').textContent = user.email || '';
    document.getElementById('statOrders').textContent = user.ordersCount || 0;
    document.getElementById('statFavs').textContent = (user.favorites || []).length;
  }
  
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    authService.logout();
  });
  
  const currencySelector = document.getElementById('currencySelector');
  if (currencySelector) {
    currencySelector.value = currencyService.getCurrency();
    currencySelector.addEventListener('change', (e) => {
      currencyService.setCurrency(e.target.value);
      window.location.reload();
    });
  }
  
  await updateMiniCart();
}

async function updateMiniCart() {
  const cart = await cartService.getCart();
  const count = await cartService.getCount();
  const total = await cartService.getTotal();
  
  const badge = document.getElementById('cartBadge');
  const dropdown = document.getElementById('cartDropdown');
  
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('active', count > 0);
  }
  
  if (dropdown) {
    const items = cart.items || [];
    if (items.length === 0) {
      dropdown.innerHTML = `
        <p style="text-align:center;color:#888;font-size:0.85rem;padding:20px;">Tu carrito está vacío</p>
        <a href="cart.html" class="go-to-cart">Ver carrito completo</a>
      `;
    } else {
      const itemsHtml = items.slice(0, 3).map(item => `
        <div class="cart-preview-item">
          <span>${item.name} x${item.quantity}</span>
          <span>${currencyService.formatPrice(item.price * item.quantity)}</span>
        </div>
      `).join('');
      
      const moreText = items.length > 3 ? `<p style="text-align:center;color:#888;font-size:0.75rem;">+${items.length - 3} items más</p>` : '';
      
      dropdown.innerHTML = `
        ${itemsHtml}
        ${moreText}
        <div class="cart-preview-total">Total: ${currencyService.formatPrice(total)}</div>
        <a href="cart.html" class="go-to-cart">Ver carrito completo</a>
      `;
    }
  }
}

document.addEventListener('cart-updated', updateMiniCart);
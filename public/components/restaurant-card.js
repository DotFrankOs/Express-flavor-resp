import { currencyService } from '../scripts/currency/currencyService.js';

class RestaurantCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const name = this.getAttribute('name');
    const logo = this.getAttribute('logo');
    const desc = this.getAttribute('description');
    const type = this.getAttribute('type');
    const url = this.getAttribute('url');
    const topItemsRaw = this.getAttribute('top-items');
    const topItems = topItemsRaw ? JSON.parse(topItemsRaw) : [];

    const itemsToShow = topItems.slice(0, 2);

    let productsHtml = '';
    if (itemsToShow.length > 0) {
      productsHtml = `
        <div class="products-section">
          <div class="section-label">
            <img src="images/svg/food-icon.svg" alt="Popular" class="fire-icon">
            <span>Los más pedidos</span>
          </div>
          <div class="products-row">
            ${itemsToShow.map((item, index) => `
              <div class="product-card" style="--delay: ${index * 0.15}s">
                <div class="product-img-wrap">
                  ${item.image 
                    ? `<img src="${item.image}" alt="${item.name}" class="product-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                       <div class="product-img-fallback" style="display:none">${item.name.charAt(0)}</div>`
                    : `<div class="product-img-fallback">${item.name.charAt(0)}</div>`
                  }
                </div>
                <div class="product-details">
                  <div class="product-header">
                    <span class="product-name">${item.name}</span>
                    <span class="product-rank">#${index + 1}</span>
                  </div>
                  <p class="product-desc">${item.description || ''}</p>
                  <span class="product-price">${currencyService.formatPrice(item.price)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.innerHTML = `
      <div class="restaurant-banner ${type}" onclick="location.href='${url}'">
        <div class="banner-left">
          <div class="logo-wrap">
            <img src="${logo}" alt="${name}" class="restaurant-logo">
          </div>
          <div class="restaurant-meta">
            <h2>${name}</h2>
            <p class="restaurant-desc">${desc}</p>
            <div class="banner-cta">
              <span>Ver menú completo</span>
              <span class="cta-arrow">→</span>
            </div>
          </div>
        </div>
        
        <div class="banner-right">
          ${productsHtml}
        </div>
      </div>
    `;
  }
}

customElements.define('restaurant-card', RestaurantCard);
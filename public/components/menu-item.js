import { currencyService } from '../scripts/currency/currencyService.js';

class MenuItemComponent extends HTMLElement {
  static get observedAttributes() {
    return ['restaurant-id', 'restaurant-name'];
  }

  constructor() {
    super();
    this._item = null;
    this._restaurantId = '';
    this._restaurantName = '';
    this.currencyService = currencyService;
    this._modal = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'restaurant-id') this._restaurantId = newVal;
    if (name === 'restaurant-name') this._restaurantName = newVal;
  }

  set item(data) {
    this._item = data;
    this._render();
  }

  get item() {
    return this._item;
  }

  connectedCallback() {
    if (this._item) this._render();
  }

  _formatPrice(amount) {
    if (this.currencyService && typeof this.currencyService.formatPrice === 'function') {
      return this.currencyService.formatPrice(amount);
    }
    return `$${Number(amount).toFixed(2)}`;
  }

  _formatModifier(amount) {
    const absFormatted = this._formatPrice(Math.abs(amount));
    if (amount > 0) return `+ ${absFormatted}`;
    if (amount < 0) return `- ${absFormatted}`;
    return absFormatted;
  }


  _render() {
    const item = this._item;
    if (!item) {
      this.innerHTML = '<div>Cargando...</div>';
      return;
    }

    const hasOptions = (item.variants && item.variants.items?.length > 0) ||
                       (item.options && item.options.length > 0);

    this.innerHTML = `
      <div class="menu-item" role="button" tabindex="0">
        <div class="image-container">
          <img src="${item.image || ''}" alt="${item.name}" loading="lazy">
        </div>
        <div class="content">
          <h4>${item.name}</h4>
          <p class="description">${item.description || ''}</p>
          ${hasOptions ? `<span class="has-options"> Personalizable</span>` : ''}
          <div class="price">${this._formatPrice(item.price)}</div>
          <button class="add-btn" data-action="open-modal">
            ${hasOptions ? 'Personalizar' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    `;

    // Eventos
    const card = this.querySelector('.menu-item');
    const btn = this.querySelector('.add-btn');

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-btn')) this._openModal();
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hasOptions) {
        this._openModal();
      } else {
        this._addToCartDirect();
      }
    });
  }

  /* ========== AGREGAR DIRECTO (sin opciones) ========== */
  _addToCartDirect() {
    const item = this._item;
    const cartItem = {
      id: item.id,
      name: item.name,
      baseName: item.name,
      price: item.price,
      basePrice: item.price,
      restaurantId: this._restaurantId,
      restaurantName: this._restaurantName,
      quantity: 1,
      variant: null,
      options: [],
      image: item.image || null
    };
    this._dispatchAdd(cartItem);
    this._flashButton(this.querySelector('.add-btn'));
  }

  /* ========== MODAL ========== */
  _openModal() {
    if (this._modal) return; // ya abierto

    const item = this._item;
    const overlay = document.createElement('div');
    overlay.className = 'item-modal-overlay';
    
    const hasImage = item.image ? `<img src="${item.image}" alt="${item.name}">` : '';
    
    // Generar HTML de opciones
    let optionsHtml = '';
    
    // Variantes
    if (item.variants && item.variants.items?.length > 0) {
      const required = item.variants.required;
      optionsHtml += `
        <div class="modal-section">
          <div class="modal-section-title">
            ${item.variants.name || 'Elige una opción'}
            ${required ? '<span class="required">* Requerido</span>' : ''}
          </div>
          <select data-type="variant" ${required ? 'required' : ''}>
            <option value="">-- Seleccionar --</option>
            ${item.variants.items.map(v => {
              const extra = v.price - item.price;
              const extraText = extra !== 0 ? `(${this._formatModifier(extra)})` : '';
              return `<option value="${v.id}" data-price="${v.price}">${v.name} ${extraText}</option>`;
            }).join('')}
          </select>
        </div>
      `;
    }

    // Opciones adicionales
    if (item.options && item.options.length > 0) {
      item.options.forEach(opt => {
        optionsHtml += `<div class="modal-section">
          <div class="modal-section-title">
            ${opt.name}
            ${opt.required ? '<span class="required">* Requerido</span>' : ''}
          </div>`;
        
        if (opt.multiSelect) {
          optionsHtml += `<div class="modal-checkbox-group" data-option-id="${opt.id}">`;
          opt.choices.forEach(choice => {
            const extraText = choice.priceModifier !== 0 ? `(${this._formatModifier(choice.priceModifier)})` : '';
            optionsHtml += `
              <label>
                <input type="checkbox" value="${choice.id}" data-price="${choice.priceModifier || 0}">
                ${choice.name} ${extraText}
              </label>
            `;
          });
          optionsHtml += `</div>`;
        } else {
          optionsHtml += `
            <select data-option-id="${opt.id}" ${opt.required ? 'required' : ''}>
              <option value="">-- Seleccionar --</option>
              ${opt.choices.map(c => {
                const extraText = c.priceModifier !== 0 ? `(${this._formatModifier(c.priceModifier)})` : '';
                return `<option value="${c.id}" data-price="${c.priceModifier || 0}">${c.name} ${extraText}</option>`;
              }).join('')}
            </select>
          `;
        }
        optionsHtml += `</div>`;
      });
    }

    overlay.innerHTML = `
      <div class="item-modal" role="dialog" aria-modal="true">
        <div class="item-modal-header">
          ${hasImage}
          <button class="item-modal-close" aria-label="Cerrar">✕</button>
        </div>
        <div class="item-modal-body">
          <h2>${item.name}</h2>
          <p class="modal-description">${item.description || ''}</p>
          
          ${optionsHtml}
          
          <div class="modal-price-row">
            <span class="modal-price-label">Total</span>
            <span class="modal-price-value">
              <span class="original" style="display:none"></span>
              <span class="current">${this._formatPrice(item.price)}</span>
            </span>
          </div>
          
          <button class="modal-add-btn" data-action="confirm">
            <span>🛒</span> Agregar al carrito
          </button>
          <div class="modal-error"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this._modal = overlay;
    document.body.style.overflow = 'hidden'; // bloquear scroll

    // Eventos del modal
    const closeBtn = overlay.querySelector('.item-modal-close');
    closeBtn.addEventListener('click', () => this._closeModal());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeModal();
    });

    // Cambios en selects/checkboxes actualizan precio
    overlay.querySelectorAll('select, input[type="checkbox"]').forEach(el => {
      el.addEventListener('change', () => this._updateModalPrice());
    });

    // Botón confirmar
    overlay.querySelector('.modal-add-btn').addEventListener('click', () => this._confirmModal());
    
    // Tecla ESC
    this._escHandler = (e) => { if (e.key === 'Escape') this._closeModal(); };
    document.addEventListener('keydown', this._escHandler);

    this._updateModalPrice();
  }

  _closeModal() {
    if (!this._modal) return;
    this._modal.classList.add('closing');
    document.removeEventListener('keydown', this._escHandler);
    
    setTimeout(() => {
      this._modal.remove();
      this._modal = null;
      document.body.style.overflow = '';
    }, 200);
  }

  _updateModalPrice() {
  if (!this._modal) return;
  const item = this._item;
  let total = item.price;

  // Variante
  const variantSelect = this._modal.querySelector('select[data-type="variant"]');
  if (variantSelect && variantSelect.value) {
    total = Number(variantSelect.selectedOptions[0].dataset.price);
  }

  // Opciones single
  this._modal.querySelectorAll('select[data-option-id]').forEach(sel => {
    if (sel.value) total += Number(sel.selectedOptions[0].dataset.price);
  });

  this._modal.querySelectorAll('.modal-checkbox-group').forEach(group => {
    group.querySelectorAll('input:checked').forEach(chk => {
      total += Number(chk.dataset.price);
    });
  });

  const originalEl = this._modal.querySelector('.modal-price-value .original');
  const currentEl = this._modal.querySelector('.modal-price-value .current');

  currentEl.classList.remove('price-up', 'price-down');

  if (total > item.price) {
    originalEl.style.display = 'inline';
    originalEl.textContent = this._formatPrice(item.price);
    currentEl.textContent = this._formatPrice(total);
    currentEl.classList.add('price-up');
  } else if (total < item.price) {
    originalEl.style.display = 'inline';
    originalEl.textContent = this._formatPrice(item.price);
    currentEl.textContent = this._formatPrice(total);
    currentEl.classList.add('price-down');
  } else {
    originalEl.style.display = 'none';
    currentEl.textContent = this._formatPrice(item.price);
  }
}
  _confirmModal() {
    const item = this._item;
    const errorEl = this._modal.querySelector('.modal-error');
    errorEl.textContent = '';

    let selectedVariant = null;
    const variantSelect = this._modal.querySelector('select[data-type="variant"]');
    if (item.variants) {
      if (item.variants.required && (!variantSelect || !variantSelect.value)) {
        errorEl.textContent = 'Por favor selecciona una opción requerida.';
        return;
      }
      if (variantSelect && variantSelect.value) {
        const v = item.variants.items.find(x => x.id === variantSelect.value);
        selectedVariant = { variantId: v.id, variantName: v.name, price: v.price };
      }
    }

    // Recolectar opciones
    const selectedOptions = [];
    let valid = true;

    if (item.options) {
      item.options.forEach(opt => {
        if (opt.multiSelect) {
          const group = this._modal.querySelector(`.modal-checkbox-group[data-option-id="${opt.id}"]`);
          const checked = group ? Array.from(group.querySelectorAll('input:checked')).map(chk => {
            const choice = opt.choices.find(c => c.id === chk.value);
            return {
              optionId: opt.id, optionName: opt.name,
              choiceId: chk.value, choiceName: choice?.name || chk.value,
              extraCost: Number(chk.dataset.price)
            };
          }) : [];
          if (opt.required && checked.length === 0) {
            errorEl.textContent = `Selecciona al menos una opción de: ${opt.name}`;
            valid = false;
          }
          selectedOptions.push(...checked);
        } else {
          const sel = this._modal.querySelector(`select[data-option-id="${opt.id}"]`);
          if (opt.required && (!sel || !sel.value)) {
            errorEl.textContent = `Selecciona una opción de: ${opt.name}`;
            valid = false;
          }
          if (sel && sel.value) {
            const choice = opt.choices.find(c => c.id === sel.value);
            selectedOptions.push({
              optionId: opt.id, optionName: opt.name,
              choiceId: sel.value, choiceName: choice?.name || sel.value,
              extraCost: Number(sel.selectedOptions[0].dataset.price)
            });
          }
        }
      });
    }

    if (!valid) return;

    let finalPrice = selectedVariant ? selectedVariant.price : item.price;
    selectedOptions.forEach(opt => finalPrice += opt.extraCost);

    let displayName = item.name;
    if (selectedVariant) displayName += ` (${selectedVariant.variantName})`;

    const cartItem = {
      id: item.id, name: displayName, baseName: item.name,
      price: finalPrice, basePrice: item.price,
      restaurantId: this._restaurantId, restaurantName: this._restaurantName,
      quantity: 1, variant: selectedVariant, options: selectedOptions,
      image: item.image || null
    };

    this._dispatchAdd(cartItem);
    this._closeModal();
  }

  _dispatchAdd(cartItem) {
    this.dispatchEvent(new CustomEvent('add-to-cart', {
      detail: cartItem, bubbles: true, composed: true
    }));
  }

  _flashButton(btn) {
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = '✓ Agregado';
    btn.style.background = '#2e7d32';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1200);
  }
}

customElements.define('menu-item', MenuItemComponent);
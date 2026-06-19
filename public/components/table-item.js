import { currencyService } from '../scripts/currency/currencyService.js';

class TableItem extends HTMLElement {
    static get observedAttributes() {
        return ['table-id', 'label', 'status', 'selected', 'table-style', 'data-price'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const status = this.getAttribute('status') || 'available';
        const label = this.getAttribute('label') || this.getAttribute('table-id') || '?';
        const selected = this.hasAttribute('selected');
        const style = this.getAttribute('table-style') || 'standard';
        const price = parseFloat(this.getAttribute('data-price') || '0');

        let priceHtml = '';
        if (price > 0) {
            priceHtml = `<span class="table-price">${currencyService.formatPrice(price)}</span>`;
        } else {
            priceHtml = `<span class="table-price free">Gratis</span>`;
        }

        this.innerHTML = `
            <div class="table ${status} ${selected ? 'selected' : ''} style-${style}">
                <div class="table-name">${label}</div>
                ${priceHtml}
                ${style !== 'standard' ? `<span class="table-badge">${style}</span>` : ''}
            </div>
        `;
    }
}

customElements.define('table-item', TableItem);
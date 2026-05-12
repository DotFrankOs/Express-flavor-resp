class TableItem extends HTMLElement {
    static get observedAttributes() {
        return ['table-id', 'label', 'status', 'selected', 'table-style'];
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

        this.innerHTML = `
            <div class="table ${status} ${selected ? 'selected' : ''} style-${style}">
                <div class="table-name">${label}</div>
                ${style !== 'standard' ? `<span class="table-badge">${style}</span>` : ''}
            </div>
        `;
    }
}

customElements.define('table-item', TableItem);
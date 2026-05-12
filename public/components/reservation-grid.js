import { reservationService } from '../scripts/reservation/reservationService.js';
import { authService } from '../scripts/auth/authService.js';
import { tableConfigService } from '../scripts/tables/tableConfigService.js';
import { alertService } from '../scripts/alert/alertService.js';
import './table-item.js';

class ReservationGrid extends HTMLElement {
  constructor() {
    super();
    this.restaurantId = '';
    this.selectedStart = null;
    this.selectedTables = new Set();
    this.minDuration = 1;
    this.maxDuration = 2;
    this.selectedDuration = 2;
    this._config = null;
  }

  async connectedCallback() {
    this.restaurantId = this.getAttribute('restaurant-id') || '';

    const minAttr = this.getAttribute('min-duration');
    const maxAttr = this.getAttribute('max-duration');
    if (minAttr) this.minDuration = parseInt(minAttr, 10);
    if (maxAttr) this.maxDuration = parseInt(maxAttr, 10);
    this.selectedDuration = this.maxDuration;

    this.renderSkeleton();
    
    try {
      this._config = await tableConfigService.getConfig(this.restaurantId);
      this.render();
      this.addEvents();
    } catch (err) {
      this.innerHTML = '<p class="error">Error al cargar mesas</p>';
    }
}

  getCurrentUserId() {
    const user = authService.getCurrentUser();
    return user ? user.user : 'anonymous';
  }

  addEvents() {
    this.addEventListener('click', async (e) => {
      const tableItem = e.composedPath().find(el => el.tagName === 'TABLE-ITEM');

      if (tableItem) {
        const status = tableItem.getAttribute('status');
        const tableId = parseInt(tableItem.getAttribute('table-id'), 10);

        if (status === 'available') {
          if (!this.selectedStart) {
            alertService.show('Primero selecciona una fecha y hora', 'info');
            return;
          }
          if (this.selectedTables.has(tableId)) {
            this.selectedTables.delete(tableId);
            tableItem.removeAttribute('selected');
          } else {
            this.selectedTables.add(tableId);
            tableItem.setAttribute('selected', '');
          }
          return;
        }

        if (status === 'reserved-by-user') {
          const startTime = tableItem.getAttribute('data-starttime');
          const confirmed = await alertService.confirm(
            `¿Cancelar reserva de la mesa ${tableId} a las ${new Date(startTime).toLocaleString()}?`
          );
          if (confirmed) {
            const result = await reservationService.cancel(this.restaurantId, tableId, startTime);
            if (!result.success) {
              alertService.show(result.message, 'error');
            }
            this.selectedTables.clear();
            await this.renderTables();
          }
          return;
        }
      }

      if (e.target.id === 'confirm-reservation-btn') {
        await this.confirmReservation();
        return;
      }

      if (e.target.id === 'close-ticket-btn' || e.target.id === 'ticket-overlay') {
        this.closeTicket();
        return;
      }

      if (e.target.id === 'print-ticket-btn') {
        this.printTicket();
      }
    });

    this.addEventListener('change', async (e) => {
      if (e.target.id === 'datetime-picker') {
        this.selectedStart = e.target.value ? new Date(e.target.value) : null;
        this.selectedTables.clear();
        await this.renderTables();
      }

      if (e.target.id === 'duration-picker') {
        const val = parseInt(e.target.value, 10);
        if (val >= this.minDuration && val <= this.maxDuration) {
          this.selectedDuration = val;
          this.selectedTables.clear();
          await this.renderTables();
        }
      }
    });
  }

  getEndTime(start) {
    return new Date(start.getTime() + this.selectedDuration * 60 * 60 * 1000);
  }

  async confirmReservation() {
    if (!this.selectedStart) {
      alertService.show('Selecciona una fecha y hora', 'info');
      return;
    }
    if (this.selectedTables.size === 0) {
      alertService.show('Selecciona al menos una mesa', 'info');
      return;
    }

    const start = this.selectedStart;
    const end = this.getEndTime(start);
    const occupied = await reservationService.getAvailableTables(this.restaurantId, start, end);

    for (const t of this.selectedTables) {
      if (occupied.has(t)) {
        alertService.show(`La mesa ${t} ya no está disponible en ese horario.`, 'error');
        return;
      }
    }

    for (const tableNumber of this.selectedTables) {
      const result = await reservationService.reserve(
        this.restaurantId,
        tableNumber,
        start,
        this.selectedDuration
      );
      if (result.success) {
        this.showTicket(tableNumber, result.reservation.code, start, end);
      } else {
        alertService.show(result.message, 'error');
      }
    }

    this.selectedTables.clear();
    await this.renderTables();
  }

  showTicket(tableNumber, code, start, end) {
    const modal = this.querySelector('#ticket-modal');
    this.querySelector('#ticket-table-number').textContent = tableNumber;
    this.querySelector('#ticket-code').textContent = code;
    this.querySelector('#ticket-datetime').textContent =
      `${start.toLocaleString()} – ${end.toLocaleTimeString()}`;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  closeTicket() {
    const modal = this.querySelector('#ticket-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  printTicket() {
    const table = this.querySelector('#ticket-table-number').textContent;
    const code = this.querySelector('#ticket-code').textContent;
    const datetime = this.querySelector('#ticket-datetime').textContent;
    const html = `
      <div style="font-family:Arial; padding:20px; text-align:center;">
        <h2>Ticket de Reserva</h2>
        <p>Mesa: <strong>${table}</strong></p>
        <p>Horario: <strong>${datetime}</strong></p>
        <p>Código: <strong>${code}</strong></p>
        <p style="font-size:0.85rem">Muéstralo al llegar.</p>
      </div>`;
    const w = window.open('', '_blank', 'width=400,height=400');
    w.document.write(html);
    w.document.close();
    w.print();
  }

  async renderTables() {
    const grid = this.querySelector('.table-grid');
    if (!grid || !this._config) return;

    const layout = this._config.layout;
    const tables = this._config.tables;

    grid.style.gridTemplateColumns = `repeat(${layout.columns}, 1fr)`;
    grid.style.gap = layout.gap;

    const currentUserId = this.getCurrentUserId();
    const reservations = await reservationService.getAll(this.restaurantId);
    const end = this.selectedStart ? this.getEndTime(this.selectedStart) : null;

    const occupiedBy = {};
    if (this.selectedStart) {
      reservations.forEach(r => {
        const rStart = new Date(r.startTime);
        const rEnd = new Date(r.endTime);
        if (rStart < end && rEnd > this.selectedStart) {
          occupiedBy[r.number] = r.userId;
        }
      });
    }

    let html = '';
    for (const table of tables) {
      const i = table.id;
      let status = 'available';
      let extraAttrs = '';

      if (this.selectedStart) {
        if (occupiedBy[i]) {
          if (occupiedBy[i] === currentUserId) {
            status = 'reserved-by-user';
            const r = reservations.find(r => 
              r.number === i && 
              new Date(r.startTime) < end && 
              new Date(r.endTime) > this.selectedStart
            );
            extraAttrs = `data-starttime="${r.startTime}" title="Tu reserva - Click para cancelar"`;
          } else {
            status = 'reserved';
            extraAttrs = 'title="Reservada por otro usuario"';
          }
        }
      }

      const selected = this.selectedTables.has(i) ? 'selected' : '';

      html += `
        <table-item
          table-id="${i}"
          label="${table.label || table.name}"
          table-style="${table.style || 'standard'}"
          status="${status}"
          ${selected ? 'selected' : ''}
          ${extraAttrs}>
        </table-item>
      `;
    }
    grid.innerHTML = html;
  }

  renderSkeleton() {
    this.innerHTML = `
      <div class="reservation-section">
        <h3>Reservar Mesa</h3>
        <p class="loading">Cargando mesas...</p>
      </div>
    `;
  }

  async render() {
    this.innerHTML = `
      <div class="reservation-section">
        <h3>Reservar Mesa</h3>
        <div class="datetime-container">
          <div>
            <label for="datetime-picker">Fecha y hora: </label>
            <input type="datetime-local" id="datetime-picker" />
          </div>
          <div>
            <label for="duration-picker" class="duration-label">Duración: </label>
            <select id="duration-picker">
              ${this._generateDurationOptions()}
            </select>
            <span class="duration-label">hora(s)</span>
          </div>
          <small style="display:block; width:100%; text-align:center; margin-top:4px; color:#666;">
            (Reserva entre ${this.minDuration} y ${this.maxDuration} horas)
          </small>
        </div>
        <div class="table-grid"></div>
        <button id="confirm-reservation-btn">Confirmar Reserva</button>
      </div>

      <div id="ticket-modal" aria-hidden="true">
        <div id="ticket-overlay"></div>
        <div class="modal-box">
          <h3> Reserva Guardada</h3>
          <p>Mesa: <strong><span id="ticket-table-number">-</span></strong></p>
          <p>Horario: <strong><span id="ticket-datetime">-</span></strong></p>
          <p>Código: <strong><span id="ticket-code">-</span></strong></p>
          <p style="font-size:0.9rem;">Muestra este código al llegar.</p>
          <button id="print-ticket-btn" class="alert-btn" style="margin-right:8px;">Imprimir</button>
          <button id="close-ticket-btn" class="alert-btn secondary">Cerrar</button>
        </div>
      </div>
    `;

    await this.renderTables();
    }

  _generateDurationOptions() {
    let options = '';
    for (let h = this.minDuration; h <= this.maxDuration; h++) {
      const selected = h === this.selectedDuration ? 'selected' : '';
      options += `<option value="${h}" ${selected}>${h}</option>`;
    }
    return options;
  }
}

customElements.define('reservation-grid', ReservationGrid);
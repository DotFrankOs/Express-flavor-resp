import { authService } from '../auth/authService.js';
import { reservationService } from '../reservation/reservationService.js';
import { currencyService } from '../currency/currencyService.js';
import { alertService } from '../alert/alertService.js';
import { restaurantService } from '../restaurants/restaurantService.js';

let currentReservations = [];
let reservationToCancel = null;

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    iso: d.toISOString(),
    raw: d
  };
}

function getStatusClass(reservation) {
  const now = new Date();
  const endTime = new Date(reservation.endTime);
  
  if (reservation.status === 'cancelled') return 'cancelled';
  if (endTime < now) return 'past';
  return 'active';
}

function getStatusBadge(statusClass) {
  const labels = {
    active: 'Activa',
    past: 'Finalizada',
    cancelled: 'Cancelada'
  };
  return `<span class="reservation-status-badge ${statusClass}">${labels[statusClass]}</span>`;
}

async function loadReservations() {
  const container = document.getElementById('reservations-list-container');
  
  try {
    // Cargar todas las reservas del usuario
    currentReservations = await reservationService.getUserReservations();
    
    // Enriquecer con datos de restaurantes (logos)
    const restaurants = await restaurantService.getAll();
    const restaurantMap = {};
    restaurants.forEach(r => restaurantMap[r.id] = r);
    
    currentReservations = currentReservations.map(r => ({
      ...r,
      restaurantLogo: restaurantMap[r.restaurantId]?.logo || '',
      restaurantName: restaurantMap[r.restaurantId]?.name || r.restaurantName || r.restaurantId
    }));
    
    // Ordenar: activas primero, luego por fecha más cercana
    const now = new Date();
    currentReservations.sort((a, b) => {
      const aEnd = new Date(a.endTime);
      const bEnd = new Date(b.endTime);
      const aActive = aEnd > now && a.status !== 'cancelled';
      const bActive = bEnd > now && b.status !== 'cancelled';
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(a.startTime) - new Date(b.startTime);
    });
    
    renderReservations();
    updateStats();
    renderNextReservation();
    
  } catch (err) {
    console.error('Error cargando reservas:', err);
    container.innerHTML = `
      <div class="reservations-empty-state">
        <img src="images/svg/warning-icon.svg" alt="Error" class="reservations-empty-icon">
        <h3>Error al cargar reservas</h3>
        <p>Intenta recargar la página.</p>
      </div>
    `;
  }
}

function renderReservations() {
  const container = document.getElementById('reservations-list-container');
  
  if (currentReservations.length === 0) {
    container.innerHTML = `
      <div class="reservations-empty-state">
        <img src="images/svg/calendar-empty.svg" alt="Sin reservas" class="reservations-empty-icon">
        <h3>No tenés reservas</h3>
        <p>Tus reservas aparecerán aquí cuando hagas una.</p>
        <a href="restaurantes.html" class="btn-primary">Hacer una reserva</a>
      </div>
    `;
    return;
  }
  
  const now = new Date();
  
  const html = currentReservations.map(reservation => {
    const statusClass = getStatusClass(reservation);
    const start = formatDateTime(reservation.startTime);
    const end = formatDateTime(reservation.endTime);
    const isActive = statusClass === 'active';
    const isPast = statusClass === 'past';
    
    const hasLogo = reservation.restaurantLogo && reservation.restaurantLogo.trim() !== '';
    
    // Calcular duración en horas
    const durationMs = new Date(reservation.endTime) - new Date(reservation.startTime);
    const durationHours = Math.round(durationMs / (1000 * 60 * 60));
    
    return `
      <div class="reservation-card ${statusClass}" data-id="${reservation.code}">
        ${getStatusBadge(statusClass)}
        
        <div class="reservation-icon-wrap">
          <img src="images/svg/calendar-icon.svg" alt="">
        </div>
        
        <div class="reservation-details">
          <div class="reservation-restaurant">
            ${hasLogo 
              ? `<img src="${reservation.restaurantLogo}" alt="${reservation.restaurantName}" class="restaurant-logo-sm" onerror="this.style.display='none'">`
              : `<div class="restaurant-logo-fallback"><img src="images/svg/store-icon.svg" alt=""></div>`
            }
            <span class="restaurant-name-text">${reservation.restaurantName}</span>
          </div>
          
          <div class="reservation-table-name">Mesa ${reservation.number}</div>
          
          <div class="reservation-datetime">
            ${start.date} · ${start.time} – ${end.time}
          </div>
          
          <div class="reservation-duration">
            <img src="images/svg/clock-icon.svg" alt="" class="section-icon-sm" style="width:12px;height:12px;">
            ${durationHours} hora${durationHours > 1 ? 's' : ''}
          </div>
          
          <div class="reservation-code-box">
            <img src="images/svg/key-icon.svg" alt="" style="width:14px;height:14px;">
            ${reservation.code}
          </div>
          
          ${reservation.price > 0 
            ? `<div class="reservation-price">${currencyService.formatPrice(reservation.price)}</div>`
            : `<div class="reservation-price free">Gratis</div>`
          }
          
          <div class="reservation-actions">
            ${isActive ? `
              <button class="reservation-btn ticket" onclick="showTicket('${reservation.code}')">
                <img src="images/svg/orders-icon.svg" alt="" class="btn-icon-sm">
                Ver ticket
              </button>
              <button class="reservation-btn cancel" onclick="openCancelModal('${reservation.code}')">
                <img src="images/svg/trash-icon.svg" alt="" class="btn-icon-sm">
                Cancelar
              </button>
            ` : isPast ? `
              <button class="reservation-btn ticket" onclick="showTicket('${reservation.code}')">
                <img src="images/svg/orders-icon.svg" alt="" class="btn-icon-sm">
                Ver ticket
              </button>
            ` : `
              <span style="color:#8a7a6a;font-size:0.85rem;">
                Cancelada el ${reservation.cancelledAt ? formatDateTime(reservation.cancelledAt).date : '—'}
              </span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `<div class="reservations-list">${html}</div>`;
}

function updateStats() {
  const now = new Date();
  
  const total = currentReservations.length;
  const active = currentReservations.filter(r => {
    const end = new Date(r.endTime);
    return end > now && r.status !== 'cancelled';
  }).length;
  const past = currentReservations.filter(r => {
    const end = new Date(r.endTime);
    return end < now && r.status !== 'cancelled';
  }).length;
  const cancelled = currentReservations.filter(r => r.status === 'cancelled').length;
  
  const totalSpent = currentReservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
  
  document.getElementById('stat-total-reservations').textContent = total;
  document.getElementById('stat-active-reservations').textContent = active;
  document.getElementById('stat-past-reservations').textContent = past;
  document.getElementById('stat-cancelled-reservations').textContent = cancelled;
  document.getElementById('stat-total-spent').textContent = currencyService.formatPrice(totalSpent);
}

function renderNextReservation() {
  const now = new Date();
  const upcoming = currentReservations.filter(r => {
    const start = new Date(r.startTime);
    return start > now && r.status !== 'cancelled';
  });
  
  const box = document.getElementById('next-reservation-box');
  const content = document.getElementById('next-reservation-content');
  
  if (upcoming.length === 0) {
    box.style.display = 'none';
    return;
  }
  
  // La más próxima
  const next = upcoming[0];
  const start = formatDateTime(next.startTime);
  const durationMs = new Date(next.endTime) - new Date(next.startTime);
  const durationHours = Math.round(durationMs / (1000 * 60 * 60));
  
  content.innerHTML = `
    <div class="next-restaurant">${next.restaurantName}</div>
    <div class="next-table">Mesa ${next.number}</div>
    <div class="next-time">${start.date} · ${start.time}</div>
    <div class="next-code">${next.code}</div>
  `;
  
  box.style.display = 'block';
}

// ========== MODAL CANCELAR ==========

window.openCancelModal = function(code) {
  const reservation = currentReservations.find(r => r.code === code);
  if (!reservation) return;
  
  reservationToCancel = reservation;
  
  const start = formatDateTime(reservation.startTime);
  document.getElementById('cancel-message').innerHTML = 
    `¿Cancelar tu reserva de <strong>Mesa ${reservation.number}</strong> en <strong>${reservation.restaurantName}</strong> el ${start.date} a las ${start.time}?`;
  document.getElementById('cancel-reason').value = '';
  
  const modal = document.getElementById('cancel-modal');
  modal.style.display = 'flex';
};

function closeCancelModal() {
  document.getElementById('cancel-modal').style.display = 'none';
  reservationToCancel = null;
}

async function confirmCancel() {
  if (!reservationToCancel) return;
  
  const reason = document.getElementById('cancel-reason').value.trim();
  if (!reason || reason.length < 3) {
    alertService.show('Por favor describe el motivo de la cancelación (mínimo 3 caracteres)', 'error');
    return;
  }
  
  try {
    await reservationService.cancel(
      reservationToCancel.restaurantId,
      reservationToCancel.number,
      reservationToCancel.startTime
    );
    
    // Marcar como cancelada localmente (el backend ya lo hace, pero para mock)
    const idx = currentReservations.findIndex(r => r.code === reservationToCancel.code);
    if (idx !== -1) {
      currentReservations[idx].status = 'cancelled';
      currentReservations[idx].cancellationReason = reason;
      currentReservations[idx].cancelledAt = new Date().toISOString();
    }
    
    closeCancelModal();
    renderReservations();
    updateStats();
    renderNextReservation();
    
    // Notificar al header que se actualizaron las reservas
    document.dispatchEvent(new CustomEvent('reservations-updated', { bubbles: true }));
    
    alertService.show('Reserva cancelada correctamente', 'success');
    
  } catch (err) {
    console.error('Error cancelando reserva:', err);
    alertService.show('Error al cancelar la reserva', 'error');
  }
}

// ========== MODAL TICKET ==========

window.showTicket = function(code) {
  const reservation = currentReservations.find(r => r.code === code);
  if (!reservation) return;
  
  const start = formatDateTime(reservation.startTime);
  const end = formatDateTime(reservation.endTime);
  const durationMs = new Date(reservation.endTime) - new Date(reservation.startTime);
  const durationHours = Math.round(durationMs / (1000 * 60 * 60));
  
  const content = document.getElementById('ticket-content');
  content.innerHTML = `
    <div class="ticket-row">
      <span class="ticket-label">Restaurante</span>
      <span class="ticket-value">${reservation.restaurantName}</span>
    </div>
    <div class="ticket-row">
      <span class="ticket-label">Mesa</span>
      <span class="ticket-value">${reservation.number}</span>
    </div>
    <div class="ticket-row">
      <span class="ticket-label">Fecha</span>
      <span class="ticket-value">${start.date}</span>
    </div>
    <div class="ticket-row">
      <span class="ticket-label">Horario</span>
      <span class="ticket-value">${start.time} – ${end.time}</span>
    </div>
    <div class="ticket-row">
      <span class="ticket-label">Duración</span>
      <span class="ticket-value">${durationHours} hora${durationHours > 1 ? 's' : ''}</span>
    </div>
    <div class="ticket-row">
      <span class="ticket-label">Estado</span>
      <span class="ticket-value">${reservation.status === 'cancelled' ? 'Cancelada' : new Date(reservation.endTime) < new Date() ? 'Finalizada' : 'Activa'}</span>
    </div>
    <div class="ticket-row">
      <span class="ticket-label">Precio</span>
      <span class="ticket-value">${reservation.price > 0 ? currencyService.formatPrice(reservation.price) : 'Gratis'}</span>
    </div>
    <div class="ticket-code-big">${reservation.code}</div>
    <p class="ticket-hint">Muéstralo al llegar al restaurante</p>
  `;
  
  document.getElementById('ticket-modal').style.display = 'flex';
};

function closeTicketModal() {
  document.getElementById('ticket-modal').style.display = 'none';
}

function printTicket() {
  const content = document.getElementById('ticket-content').innerHTML;
  const w = window.open('', '_blank', 'width=400,height=500');
  w.document.write(`
    <html>
      <head>
        <title>Ticket de Reserva - Express Flavor</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .ticket-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; }
          .ticket-label { color: #666; }
          .ticket-value { font-weight: 600; }
          .ticket-code-big { font-family: 'Courier New', monospace; font-size: 2.5rem; font-weight: 800; text-align: center; margin: 20px 0; letter-spacing: 8px; color: #75563c; }
          .ticket-hint { text-align: center; color: #888; font-size: 0.85rem; }
          h2 { text-align: center; color: #75563c; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>🍽️ Express Flavor</h2>
        <h3 style="text-align:center;margin-bottom:20px;">Ticket de Reserva</h3>
        ${content}
      </body>
    </html>
  `);
  w.document.close();
  w.print();
}

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  if (!authService.isLoggedIn()) {
    const container = document.getElementById('reservations-list-container');
    container.innerHTML = `
      <div class="reservations-empty-state">
        <img src="images/svg/lock-icon.svg" alt="Inicia sesión" class="reservations-empty-icon" style="opacity:0.5;">
        <h3>Inicia sesión para ver tus reservas</h3>
        <a href="index.html" class="btn-primary">Ir al login</a>
      </div>
    `;
    return;
  }
  
  await currencyService.init();
  await loadReservations();
  
  // Event listeners de modales
  document.getElementById('close-cancel-btn').addEventListener('click', closeCancelModal);
  document.getElementById('confirm-cancel-btn').addEventListener('click', confirmCancel);
  document.getElementById('close-ticket-btn').addEventListener('click', closeTicketModal);
  document.getElementById('print-ticket-btn').addEventListener('click', printTicket);
  
  // Cerrar modales al hacer click fuera
  document.getElementById('cancel-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCancelModal();
  });
  document.getElementById('ticket-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTicketModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCancelModal();
      closeTicketModal();
    }
  });
});
import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockReservations, mockRestaurants } from '../data/mockData.js';

const STORAGE_PREFIX = 'reservations_';

function _key(restaurantId) {
  return `${STORAGE_PREFIX}${restaurantId}`;
}

function _load(restaurantId) {
  const raw = localStorage.getItem(_key(restaurantId));
  let data = [];
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = []; }
  }
  if (data.length === 0 && mockReservations[restaurantId]) {
    data = [...mockReservations[restaurantId]];
    localStorage.setItem(_key(restaurantId), JSON.stringify(data));
  }
  return data;
}

function _save(restaurantId, data) {
  localStorage.setItem(_key(restaurantId), JSON.stringify(data));
}

function _generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function _getUser() {
  try {
    const raw = sessionStorage.getItem('express_flavor_session');
    if (raw) return JSON.parse(raw).user;
  } catch { /* ignore */ }
  return 'anonymous';
}

export const reservationService = {
  async getAll(restaurantId) {
    if (apiConfig.useMock) {
      return [..._load(restaurantId)];
    }
    return apiFetch(`/restaurants/${restaurantId}/reservations`);
  },

  async getReservations(restaurantId) {
    return this.getAll(restaurantId);
  },

  async saveAll(restaurantId, reservations) {
    if (apiConfig.useMock) {
      _save(restaurantId, reservations);
      return reservations;
    }
    return apiFetch(`/restaurants/${restaurantId}/reservations`, {
      method: 'PUT',
      body: JSON.stringify(reservations)
    });
  },

  async add(restaurantId, reservation) {
    if (apiConfig.useMock) {
      const list = _load(restaurantId);
      list.push(reservation);
      _save(restaurantId, list);
      return reservation;
    }
    return apiFetch(`/restaurants/${restaurantId}/reservations`, {
      method: 'POST',
      body: JSON.stringify(reservation)
    });
  },

  async remove(restaurantId, tableNumber, startTime) {
    if (apiConfig.useMock) {
      const list = _load(restaurantId).filter(
        r => !(r.number === tableNumber && r.startTime === startTime)
      );
      _save(restaurantId, list);
      return list;
    }
    return apiFetch(`/restaurants/${restaurantId}/reservations`, {
      method: 'DELETE',
      body: JSON.stringify({ tableNumber, startTime })
    });
  },

  async getAvailableTables(restaurantId, start, end) {
    const reservations = await this.getAll(restaurantId);
    const occupied = new Set();
    reservations.forEach(r => {
      const rStart = new Date(r.startTime);
      const rEnd = new Date(r.endTime);
      if (rStart < end && rEnd > start) {
        occupied.add(r.number);
      }
    });
    return occupied;
  },

  async reserve(restaurantId, tableNumber, startTime, durationHours) {
    const reservations = await this.getAll(restaurantId);
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    const overlapping = reservations.filter(r => {
      if (r.number !== tableNumber) return false;
      const rStart = new Date(r.startTime);
      const rEnd = new Date(r.endTime);
      return rStart < endTime && rEnd > startTime;
    });

    if (overlapping.length > 0) {
      return { success: false, message: 'La mesa ya está reservada en ese horario' };
    }

    const cleanReservations = reservations.map(r => ({
      number: r.number,
      startTime: r.startTime,
      endTime: r.endTime,
      duration: r.duration,
      code: r.code,
      userId: r.userId
    }));

    const newReservation = {
      number: tableNumber,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationHours,
      code: _generateCode(),
      userId: _getUser()
    };

    cleanReservations.push(newReservation);
    await this.saveAll(restaurantId, cleanReservations);

    return { success: true, reservation: newReservation };
  },
  async cancel(restaurantId, tableNumber, startTime) {
    const reservations = await this.getAll(restaurantId);
    const idx = reservations.findIndex(
      r => r.number === tableNumber && r.startTime === startTime
    );
    if (idx === -1) {
      return { success: false, message: 'Reserva no encontrada' };
    }
    reservations.splice(idx, 1);
    
    const cleanReservations = reservations.map(r => ({
      number: r.number,
      startTime: r.startTime,
      endTime: r.endTime,
      duration: r.duration,
      code: r.code,
      userId: r.userId
    }));
    
    await this.saveAll(restaurantId, cleanReservations);
    return { success: true };
  },

  seedIfEmpty(restaurantId, defaultData = []) {
    if (!apiConfig.useMock) return;
    const current = _load(restaurantId);
    if (current.length === 0 && defaultData.length > 0) {
      _save(restaurantId, defaultData);
    }
  },

  async getUserReservations() {
  const userId = _getUser();

    if (!apiConfig.useMock) {
      return apiFetch('/reservations/my', {
        headers: { 'x-user-id': userId }
      });
    }
    const all = [];

    // Iterar todos los restaurantes conocidos en mock
    const restaurantIds = ['burgers', 'italian', 'mexican', 'cafe'];
    for (const rid of restaurantIds) {
      const list = _load(rid);
      const mine = list.filter(r => r.userId === userId);
      mine.forEach(r => {
        all.push({
          ...r,
          restaurantId: rid,
          // Buscamos el nombre del restaurante en mockRestaurants
          restaurantName: mockRestaurants.find(x => x.id === rid)?.name || rid
        });
      });
    }

    // Ordenar: las más próximas primero
    return all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }
    
};
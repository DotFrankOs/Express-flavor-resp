const STORAGE_PREFIX = 'reservations_';

export const reservationRepository = {
  _key(restaurantId) {
    return `${STORAGE_PREFIX}${restaurantId}`;
  },

  getAll(restaurantId) {
    const raw = localStorage.getItem(this._key(restaurantId));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAll(restaurantId, reservations) {
    localStorage.setItem(this._key(restaurantId), JSON.stringify(reservations));
  },

  add(restaurantId, reservation) {
    const list = this.getAll(restaurantId);
    list.push(reservation);
    this.saveAll(restaurantId, list);
  },

  remove(restaurantId, tableNumber, startTime) {
    const list = this.getAll(restaurantId).filter(
      r => !(r.number === tableNumber && r.startTime === startTime)
    );
    this.saveAll(restaurantId, list);
  },

  seedIfEmpty(restaurantId, defaultData = []) {
    if (this.getAll(restaurantId).length === 0 && defaultData.length > 0) {
      this.saveAll(restaurantId, defaultData);
    }
  }
};
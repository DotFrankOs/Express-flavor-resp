import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';

const SESSION_KEY = 'express_flavor_session';
const TOKEN_KEY = 'express_flavor_token';
const USERS_KEY = 'express_flavor_users';

function _loadUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

export const authService = {
  isLoggedIn() {
    return !!sessionStorage.getItem(SESSION_KEY) && !!this.getToken();
  },

  getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    window.location.href = 'index.html';
  },

  async login(username, password) {
    if (apiConfig.useMock) {
      const users = _loadUsers();
      const user = users.find(u => u.user === username && u.pass === password);
      if (!user) throw new Error('Credenciales inválidas');
      const session = {
        user: user.user, name: user.name, role: user.role,
        avatar: user.avatar, email: user.email,
        favorites: user.favorites, ordersCount: user.ordersCount
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem(TOKEN_KEY, 'mock-token-' + Date.now());
      return session;
    }
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user: result.user, name: result.name,
      email: result.email, avatar: result.avatar,
      role: result.role, ordersCount: result.ordersCount,
      favorites: result.favorites
    }));
    sessionStorage.setItem(TOKEN_KEY, result.token);
    return result;
  },

  async register(userData) {
    if (typeof userData === 'string') {
      userData = { user: userData, pass: arguments[1], name: userData };
    }
    if (apiConfig.useMock) {
      const users = _loadUsers();
      const exists = users.find(u => u.user === userData.user);
      if (exists) throw new Error('Usuario ya existe');
      users.push(userData);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return { ...userData };
    }
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user: result.user, name: result.name, email: result.email
    }));
    sessionStorage.setItem(TOKEN_KEY, result.token);
    return result;
  }
};

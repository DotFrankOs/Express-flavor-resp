import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockUsers } from '../data/mockData.js';

const SESSION_KEY = 'express_flavor_session';
const USERS_KEY = 'express_flavor_users';

function _loadUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
    return [...mockUsers];
  }
  return JSON.parse(stored);
}

export const authService = {
  isLoggedIn() {
    return !!sessionStorage.getItem(SESSION_KEY);
  },

  getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  },

  async login(username, password) {
    if (apiConfig.useMock) {
      const users = _loadUsers();
      const user = users.find(u => u.user === username && u.pass === password);
      if (!user) throw new Error('Credenciales inválidas');
      const session = { user: user.user, name: user.name };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    }
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
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
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
};

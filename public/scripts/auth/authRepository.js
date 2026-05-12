import { apiConfig } from '../config/apiConfig.js';
import { mockUsers } from '../data/mockData.js';

const USERS_KEY = 'express_flavor_users';

export const authRepository = {
  getUsers() {
    if (apiConfig.useMock) {
      const stored = localStorage.getItem(USERS_KEY);
      if (!stored) {
        localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
        return [...mockUsers];
      }
      return JSON.parse(stored);
    }
    throw new Error('Use authService en modo API');
  },

  saveUser(newUser) {
    if (apiConfig.useMock) {
      const users = this.getUsers();
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return newUser;
    }
    throw new Error('Use authService.register en modo API');
  }
};
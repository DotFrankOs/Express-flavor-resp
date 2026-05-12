import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockReports } from '../data/mockData.js';

const REPORTS_KEY = 'express_flavor_reports';

function _load() {
  const raw = localStorage.getItem(REPORTS_KEY);
  return raw ? JSON.parse(raw) : [...mockReports];
}

function _save(data) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(data));
}

function _getUser() {
  try {
    const raw = sessionStorage.getItem('express_flavor_session');
    if (raw) return JSON.parse(raw).user;
  } catch {
    
  }
  return 'anonymous';
}

export const reportService = {
  async getAll() {
    if (apiConfig.useMock) {
      return _load();
    }
    return apiFetch('/reports');
  },

  async save(report) {
    if (apiConfig.useMock) {
      const reports = _load();
      reports.push(report);
      _save(reports);
      return report;
    }
    return apiFetch('/reports', {
      method: 'POST',
      body: JSON.stringify(report)
    });
  },

  async send(description, imageFile) {
    if (!description.trim()) {
      return { success: false, message: 'La descripción no puede estar vacía' };
    }

    const report = {
      id: Date.now(),
      description,
      image: imageFile ? imageFile.name : null,
      date: new Date().toISOString(),
      userId: _getUser()
    };

    await this.save(report);
    return { success: true, report };
  }
};
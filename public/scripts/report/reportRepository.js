const REPORTS_KEY = 'express_flavor_reports';

export const reportRepository = {
  getAll() {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  },
  save(report) {
    const reports = this.getAll();
    reports.push(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
};
import { http } from './http.js';

export async function apiGetAdminStats() {
  return http('GET', '/admin/stats');
}

export async function apiGetAuditLogs() {
  return http('GET', '/admin/audit-logs');
}

export async function apiGetSystemHealth() {
  return http('GET', '/admin/system-health');
}

export async function apiGetHealthHistory(limit = 50) {
  return http('GET', `/admin/system-health/history?limit=${limit}`);
}

export async function apiGetReportData(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate)   params.set('endDate', endDate);
  const qs = params.toString();
  return http('GET', `/admin/report-data${qs ? '?' + qs : ''}`);
}

export async function apiEmailReport(startDate, endDate, recipientEmail) {
  return http('POST', '/admin/email-report', { startDate, endDate, recipientEmail });
}

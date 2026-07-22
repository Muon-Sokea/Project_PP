import { http } from './http.js';

export async function apiRequestRefund(ticketCode, eventName, reason, details = '') {
  return http('POST', '/refunds', { ticketCode, eventName, reason, details });
}

export async function apiGetRefunds() {
  return http('GET', '/refunds');
}

export async function apiUpdateRefundStatus(ticketCode, status) {
  return http('PATCH', `/refunds/${ticketCode}`, { status });
}

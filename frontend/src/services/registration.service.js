import { http } from './http.js';

export async function apiGetMyRegistrations() {
  return http('GET', '/registrations/mine');
}

export async function apiRegisterForEvent(eventId, { ticketType = 'standard', quantity = 1, price = '0.00' } = {}) {
  return http('POST', '/registrations', { eventId, ticketType, quantity, price });
}

export async function apiGetTicket(ticketCode) {
  return http('GET', `/tickets/${ticketCode}`);
}

export async function apiGetEventAttendees(eventId) {
  return http('GET', `/events/${eventId}/tickets`);
}

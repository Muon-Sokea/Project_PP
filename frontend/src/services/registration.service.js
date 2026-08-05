import { http } from './http.js';

export async function apiGetMyRegistrations() {
  return http('GET', '/registrations/mine');
}

export async function apiRegisterForEvent(eventId, { ticketTypeId, quantity = 1, promoCode } = {}) {
  return http('POST', '/registrations', { eventId, ticketTypeId, quantity, promoCode });
}

export async function apiGetTicket(ticketCode) {
  return http('GET', `/tickets/${ticketCode}`);
}

export async function apiGetEventAttendees(eventId) {
  return http('GET', `/events/${eventId}/tickets`);
}

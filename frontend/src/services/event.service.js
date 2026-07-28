import { http } from './http.js';

export async function apiGetEvents() {
  return http('GET', '/events');
}

export async function apiGetAllEvents() {
  return http('GET', '/events/all');
}

export async function apiGetEventById(id) {
  return http('GET', `/events/${id}`);
}

export async function apiCreateEvent(eventData) {
  return http('POST', '/events', eventData);
}

export async function apiUpdateEvent(id, eventData) {
  return http('PUT', `/events/${id}`, eventData);
}

export async function apiDeleteEvent(id) {
  return http('DELETE', `/events/${id}`);
}

export async function apiTogglePublish(id) {
  return http('PATCH', `/events/${id}/publish`);
}

export async function apiApproveEvent(id) {
  return http('PATCH', `/events/${id}/approve`);
}

export async function apiRejectEvent(id) {
  return http('PATCH', `/events/${id}/reject`);
}

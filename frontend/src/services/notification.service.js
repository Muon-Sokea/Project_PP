import { http } from './http.js';

export async function apiGetNotifications(limit = 30) {
  return http('GET', `/notifications?limit=${limit}`);
}

export async function apiMarkNotificationRead(id) {
  return http('PATCH', `/notifications/${id}/read`);
}

export async function apiMarkAllNotificationsRead() {
  return http('PATCH', '/notifications/read-all');
}

export async function apiGetNotificationPrefs() {
  return http('GET', '/notifications/preferences');
}

export async function apiSaveNotificationPrefs(prefs) {
  return http('PUT', '/notifications/preferences', prefs);
}

export async function apiSendTestNotification() {
  return http('POST', '/notifications/send-test');
}

export async function apiSendNotification(type, data = {}) {
  return http('POST', '/notifications/send', { type, data });
}

import { http } from './http.js';

export async function apiGetAllUsers() {
  return http('GET', '/users');
}

export async function apiGetLoginHistory() {
  return http('GET', '/users/me/login-history');
}

export async function apiUpdateUser(userId, data) {
  return http('PUT', `/users/${userId}`, data);
}

export async function apiCreateUser({ firstName, lastName, email, password, role = 'Attendee' }) {
  return http('POST', '/users', { firstName, lastName, email, password, role });
}

export async function apiDeleteUser(userId) {
  return http('DELETE', `/users/${userId}`);
}

export async function apiBulkDeleteUsers(userIds) {
  return http('POST', '/users/bulk-delete', { ids: userIds });
}

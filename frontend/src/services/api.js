// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.js — Production service layer
// Dev: Vite proxies /api → localhost:4000 (no CORS needed)
// Prod: Set VITE_API_BASE env var to your Railway backend URL
// ─────────────────────────────────────────────────────────────────────────────

// In dev, Vite proxies /api → localhost:4000 so no CORS is needed.
// In production (separate Railway service), VITE_API_BASE must be set to the
// backend's Railway URL, e.g. https://erms-backend.up.railway.app
const API_BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function _http(method, path, body) {
  const token = localStorage.getItem('erms_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

// ── Write session to localStorage after login / verify ───────────────────────
function _saveSession({ token, user }) {
  localStorage.setItem('erms_token', token);
  localStorage.setItem('erms_role',  user.role);
  localStorage.setItem('erms_user',  JSON.stringify(user));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  const data = await _http('POST', '/auth/login', { email, password });
  _saveSession(data);
  return data;
}

export async function apiRegister({ firstName, lastName, email, password, phone = '' }) {
  return _http('POST', '/auth/register', { firstName, lastName, email, password, phone });
}

export async function apiVerifyEmail(userId, code) {
  const data = await _http('POST', '/auth/verify-email', { userId, code });
  _saveSession(data);
  return data;
}

export async function apiResendOtp(userId) {
  return _http('POST', '/auth/resend-otp', { userId });
}

export async function apiForgotPassword(email) {
  return _http('POST', '/auth/forgot-password', { email });
}

export async function apiResetPassword(userId, code, newPassword) {
  return _http('POST', '/auth/reset-password', { userId, code, newPassword });
}

export async function apiLogout() {
  await _http('POST', '/auth/logout').catch(() => {});
  ['erms_user', 'erms_role', 'erms_token'].forEach(k => localStorage.removeItem(k));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetEvents() {
  return _http('GET', '/events');
}

export async function apiGetEventById(id) {
  return _http('GET', `/events/${id}`);
}

export async function apiCreateEvent(eventData) {
  return _http('POST', '/events', eventData);
}

export async function apiUpdateEvent(id, eventData) {
  return _http('PUT', `/events/${id}`, eventData);
}

export async function apiDeleteEvent(id) {
  return _http('DELETE', `/events/${id}`);
}

export async function apiTogglePublish(id) {
  return _http('PATCH', `/events/${id}/publish`);
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATIONS & TICKETS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetMyRegistrations() {
  return _http('GET', '/registrations/mine');
}

export async function apiRegisterForEvent(eventId, { ticketType = 'standard', quantity = 1, price = '0.00' } = {}) {
  return _http('POST', '/registrations', { eventId, ticketType, quantity, price });
}

export async function apiGetTicket(ticketCode) {
  return _http('GET', `/tickets/${ticketCode}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// REFUNDS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiRequestRefund(ticketCode, eventName, reason, details = '') {
  return _http('POST', '/refunds', { ticketCode, eventName, reason, details });
}

export async function apiGetRefunds() {
  return _http('GET', '/refunds');
}

export async function apiUpdateRefundStatus(ticketCode, status) {
  return _http('PATCH', `/refunds/${ticketCode}`, { status });
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetTestimonials() {
  return _http('GET', '/testimonials');
}

export async function apiSubmitTestimonial({ content, rating, eventId = null }) {
  return _http('POST', '/testimonials', { content, rating, eventId });
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS (staff management)
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetAllUsers() {
  return _http('GET', '/users');
}

export async function apiUpdateUser(userId, data) {
  return _http('PUT', `/users/${userId}`, data);
}

export async function apiCreateUser({ firstName, lastName, email, password, role = 'Attendee' }) {
  return _http('POST', '/users', { firstName, lastName, email, password, role });
}

export async function apiDeleteUser(userId) {
  return _http('DELETE', `/users/${userId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function getSession() {
  try { return JSON.parse(localStorage.getItem('erms_user')); } catch { return null; }
}

export function getCurrentRole() {
  return localStorage.getItem('erms_role') || null;
}

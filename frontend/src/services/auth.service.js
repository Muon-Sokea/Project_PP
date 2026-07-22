import { http, _saveSession } from './http.js';

export async function apiLogin(email, password) {
  const data = await http('POST', '/auth/login', { email, password });
  _saveSession(data);
  return data;
}

export async function apiRegister({ firstName, lastName, email, password, phone = '' }) {
  return http('POST', '/auth/register', { firstName, lastName, email, password, phone });
}

export async function apiVerifyEmail(userId, code) {
  const data = await http('POST', '/auth/verify-email', { userId, code });
  _saveSession(data);
  return data;
}

export async function apiResendOtp(userId) {
  return http('POST', '/auth/resend-otp', { userId });
}

export async function apiForgotPassword(email) {
  return http('POST', '/auth/forgot-password', { email });
}

export async function apiResetPassword(userId, code, newPassword) {
  return http('POST', '/auth/reset-password', { userId, code, newPassword });
}

export async function apiLogout() {
  await http('POST', '/auth/logout').catch(() => {});
  ['erms_user', 'erms_role', 'erms_token'].forEach(k => localStorage.removeItem(k));
}

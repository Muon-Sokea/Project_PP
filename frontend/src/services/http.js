// ─────────────────────────────────────────────────────────────────────────────
// src/services/http.js — HTTP helper shared by all domain services
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE } from '../config/api.config.js';

function _saveSession({ token, user }) {
  localStorage.setItem('erms_token', token);
  localStorage.setItem('erms_role',  user.role);
  localStorage.setItem('erms_user',  JSON.stringify(user));
}

export async function http(method, path, body) {
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

export { _saveSession };

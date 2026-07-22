import { API_BASE } from '../config/api.config.js';
import { http } from './http.js';

export async function apiGetOrganizerStats(page = 1, limit = 20) {
  return http('GET', `/organizer/stats?page=${page}&limit=${limit}`);
}

export async function apiUploadImage(file) {
  const token = localStorage.getItem('erms_token');
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

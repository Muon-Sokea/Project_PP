// ─────────────────────────────────────────────────────────────────────────────
// src/config/env.js — Environment variable accessors
// ─────────────────────────────────────────────────────────────────────────────

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE ?? '';
}

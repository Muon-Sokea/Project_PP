// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.js — Barrel file re-exporting all domain services
// ─────────────────────────────────────────────────────────────────────────────
// Existing imports from '../services/api.js' continue to work.
// New code can import directly from the domain service files:
//   import { apiLogin } from '../services/auth.service.js';
//   import { apiGetEvents } from '../services/event.service.js';

export { http, _saveSession } from './http.js';

// Auth
export {
  apiLogin,
  apiRegister,
  apiVerifyEmail,
  apiResendOtp,
  apiForgotPassword,
  apiResetPassword,
  apiLogout,
} from './auth.service.js';

// Events
export {
  apiGetEvents,
  apiGetEventById,
  apiCreateEvent,
  apiUpdateEvent,
  apiDeleteEvent,
  apiTogglePublish,
} from './event.service.js';

// Registrations & Tickets
export {
  apiGetMyRegistrations,
  apiRegisterForEvent,
  apiGetTicket,
} from './registration.service.js';

// Refunds
export {
  apiRequestRefund,
  apiGetRefunds,
  apiUpdateRefundStatus,
} from './refund.service.js';

// Testimonials
export {
  apiGetTestimonials,
  apiSubmitTestimonial,
} from './testimonial.service.js';

// Users
export {
  apiGetAllUsers,
  apiUpdateUser,
  apiCreateUser,
  apiDeleteUser,
} from './user.service.js';

// Organizer
export {
  apiGetOrganizerStats,
  apiUploadImage,
} from './organizer.service.js';

// Admin
export {
  apiGetAdminStats,
} from './admin.service.js';

// Session helpers
export function getSession() {
  try { return JSON.parse(localStorage.getItem('erms_user')); } catch { return null; }
}

export function getCurrentRole() {
  return localStorage.getItem('erms_role') || null;
}

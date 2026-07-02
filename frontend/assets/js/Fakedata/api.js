// ─────────────────────────────────────
// api.js — Service layer (Step 2, React migration)
// Mock path: localStorage + mockData.js
// Real path: fetch() → Express/Node backend
// Toggle: set USE_MOCK = false when backend is live
// ─────────────────────────────────────

import { mockUsers, mockEvents, mockTestimonials } from "./mockData.js";

const USE_MOCK  = false;
const API_BASE  = "http://localhost:4000/api";   // Express backend URL (Railway later)

// ── delay helper so mock responses feel async ──
const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────
// STORAGE HELPERS (mock only)
// ─────────────────────────────────────
function _getAttendees() {
  try { return JSON.parse(localStorage.getItem("erms_attendees") || "[]"); } catch { return []; }
}
function _saveAttendees(a) { localStorage.setItem("erms_attendees", JSON.stringify(a)); }

function _getTickets() {
  try { return JSON.parse(localStorage.getItem("erms_tickets") || "[]"); } catch { return []; }
}
function _saveTickets(t) { localStorage.setItem("erms_tickets", JSON.stringify(t)); }

function _getRefunds() {
  try { return JSON.parse(localStorage.getItem("erms_refunds") || "[]"); } catch { return []; }
}
function _saveRefunds(r) { localStorage.setItem("erms_refunds", JSON.stringify(r)); }

function _getStoredEvents() {
  try {
    const stored = JSON.parse(localStorage.getItem("erms_events") || "[]");
    return stored.length ? stored : mockEvents;
  } catch { return mockEvents; }
}
function _saveEvents(e) { localStorage.setItem("erms_events", JSON.stringify(e)); }

// ── all users = fixed staff + registered attendees ──
function _getAllUsers() {
  return [...mockUsers, ..._getAttendees()];
}

// ─────────────────────────────────────
// HTTP HELPER (real path)
// ─────────────────────────────────────
async function _http(method, path, body) {
  const token = localStorage.getItem("erms_token");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

// ─────────────────────────────────────
// AUTH
// ─────────────────────────────────────
export async function apiLogin(email, password) {
  if (!USE_MOCK) {
    const data = await _http("POST", "/auth/login", { email, password });
    localStorage.setItem("erms_token", data.token);
    localStorage.setItem("erms_role",  data.user.role);
    localStorage.setItem("erms_user",  JSON.stringify(data.user));
    return data;
  }

  await delay(300);
  const user = _getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) throw new Error("Invalid email or password.");

  const token = "mock_token_" + Date.now();
  const session = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
  localStorage.setItem("erms_token", token);
  localStorage.setItem("erms_role",  user.role);
  localStorage.setItem("erms_user",  JSON.stringify(session));
  return { token, user: session };
}

export async function apiRegister({ firstName, lastName, email, password, phone = "" }) {
  if (!USE_MOCK) return _http("POST", "/auth/register", { firstName, lastName, email, password, phone });

  await delay(300);
  const attendees = _getAttendees();
  if (attendees.some(u => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("An account with this email already exists.");

  const newUser = {
    id: Date.now(), firstName, lastName, email, password, phone,
    role: "Attendee", status: "active",
  };
  attendees.push(newUser);
  _saveAttendees(attendees);
  return { user: newUser };
}

export async function apiLogout() {
  if (!USE_MOCK) {
    await _http("POST", "/auth/logout").catch(() => {});
  }
  ["erms_user", "erms_role", "erms_token"].forEach(k => localStorage.removeItem(k));
}

// ─────────────────────────────────────
// EVENTS
// ─────────────────────────────────────
export async function apiGetEvents() {
  if (!USE_MOCK) return _http("GET", "/events");
  await delay(100);
  return _getStoredEvents();
}

export async function apiGetEventById(id) {
  if (!USE_MOCK) return _http("GET", `/events/${id}`);
  await delay(100);
  const ev = _getStoredEvents().find(e => String(e.id) === String(id));
  if (!ev) throw new Error("Event not found.");
  return ev;
}

export async function apiCreateEvent(eventData) {
  if (!USE_MOCK) return _http("POST", "/events", eventData);
  await delay(200);
  const events = _getStoredEvents();
  const newEvent = { id: Date.now(), status: "published", ...eventData };
  events.push(newEvent);
  _saveEvents(events);
  return newEvent;
}

export async function apiUpdateEvent(id, eventData) {
  if (!USE_MOCK) return _http("PUT", `/events/${id}`, eventData);
  await delay(200);
  const events = _getStoredEvents();
  const idx = events.findIndex(e => String(e.id) === String(id));
  if (idx !== -1) { events[idx] = { ...events[idx], ...eventData }; _saveEvents(events); }
  return events[idx];
}

export async function apiDeleteEvent(id) {
  if (!USE_MOCK) return _http("DELETE", `/events/${id}`);
  await delay(200);
  _saveEvents(_getStoredEvents().filter(e => String(e.id) !== String(id)));
}

export async function apiTogglePublish(id) {
  if (!USE_MOCK) return _http("PATCH", `/events/${id}/publish`);
  await delay(200);
  const events = _getStoredEvents();
  const ev = events.find(e => String(e.id) === String(id));
  if (ev) { ev.status = ev.status === "published" ? "draft" : "published"; _saveEvents(events); }
  return ev;
}

// ─────────────────────────────────────
// TICKETS / REGISTRATIONS
// ─────────────────────────────────────
export async function apiGetMyRegistrations() {
  if (!USE_MOCK) return _http("GET", "/tickets/mine");
  await delay(100);
  const user = JSON.parse(localStorage.getItem("erms_user") || "null");
  if (!user) return [];
  return _getTickets().filter(t => t.userId === user.id);
}

export async function apiRegisterForEvent(eventId, { ticketType = "standard", quantity = 1, price = "0.00" } = {}) {
  if (!USE_MOCK) return _http("POST", "/tickets", { eventId, ticketType, quantity, price });
  await delay(200);
  const user = JSON.parse(localStorage.getItem("erms_user") || "null");
  if (!user) throw new Error("Not logged in.");
  const ev = _getStoredEvents().find(e => String(e.id) === String(eventId));
  const ticket = {
    id: Date.now(),
    userId: user.id,
    event: eventId,
    event_title: ev ? ev.title : "Event",
    ticket_code: "TKT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    ticket_type: ticketType,
    quantity,
    unit_price: price,
    status: "confirmed",
    registered_at: new Date().toISOString(),
  };
  const tickets = _getTickets();
  tickets.push(ticket);
  _saveTickets(tickets);
  localStorage.setItem("erms_ticket_id", ticket.id);
  localStorage.setItem("erms_from_payment", "true");
  return ticket;
}

export async function apiGetTicket(ticketId) {
  if (!USE_MOCK) return _http("GET", `/tickets/${ticketId}`);
  await delay(100);
  const t = _getTickets().find(t => String(t.id) === String(ticketId));
  if (!t) throw new Error("Ticket not found.");
  return t;
}

// ─────────────────────────────────────
// REFUNDS
// ─────────────────────────────────────
export async function apiRequestRefund(ticketCode, eventName, reason, details = "") {
  if (!USE_MOCK) return _http("POST", "/refunds", { ticketCode, eventName, reason, details });
  await delay(200);
  const refunds = _getRefunds();
  if (refunds.find(r => r.ticketCode === ticketCode))
    throw new Error("Refund already submitted for this ticket.");
  const refund = { ticketCode, eventName, reason, details, status: "pending", requestedAt: new Date().toISOString() };
  refunds.push(refund);
  _saveRefunds(refunds);
  return refund;
}

export async function apiGetRefunds() {
  if (!USE_MOCK) return _http("GET", "/refunds");
  await delay(100);
  return _getRefunds();
}

export async function apiUpdateRefundStatus(ticketCode, status) {
  if (!USE_MOCK) return _http("PATCH", `/refunds/${ticketCode}`, { status });
  await delay(200);
  const refunds = _getRefunds();
  const r = refunds.find(r => r.ticketCode === ticketCode);
  if (r) { r.status = status; _saveRefunds(refunds); }
  return r;
}

// ─────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────
export async function apiGetTestimonials() {
  if (!USE_MOCK) return _http("GET", "/testimonials");
  await delay(100);
  // return seeded mockTestimonials (no localStorage for testimonials — read-only seed)
  return mockTestimonials;
}

export async function apiSubmitTestimonial({ content, rating, eventId = null }) {
  if (!USE_MOCK) return _http("POST", "/testimonials", { content, rating, eventId });
  await delay(200);
  const user = JSON.parse(localStorage.getItem("erms_user") || "null");
  return { id: Date.now(), content, rating, eventId, user: user ? user.firstName : "Anonymous" };
}

// ─────────────────────────────────────
// USERS (admin / superadmin)
// ─────────────────────────────────────
export async function apiGetAllUsers() {
  if (!USE_MOCK) return _http("GET", "/users");
  await delay(100);
  return _getAllUsers();
}

export async function apiUpdateUser(userId, data) {
  if (!USE_MOCK) return _http("PUT", `/users/${userId}`, data);
  await delay(200);
  const attendees = _getAttendees();
  const idx = attendees.findIndex(u => String(u.id) === String(userId));
  if (idx !== -1) { attendees[idx] = { ...attendees[idx], ...data }; _saveAttendees(attendees); }
  return attendees[idx];
}

export async function apiCreateUser({ firstName, lastName, email, password, role = "Attendee" }) {
  if (!USE_MOCK) return _http("POST", "/users", { firstName, lastName, email, password, role });
  await delay(200);
  const attendees = _getAttendees();
  if (_getAllUsers().some(u => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("Email already in use.");
  const user = { id: Date.now(), firstName, lastName, email, password, role, status: "active" };
  attendees.push(user);
  _saveAttendees(attendees);
  return user;
}

export async function apiDeleteUser(userId) {
  if (!USE_MOCK) return _http("DELETE", `/users/${userId}`);
  await delay(200);
  _saveAttendees(_getAttendees().filter(u => String(u.id) !== String(userId)));
}

// ─────────────────────────────────────
// SESSION HELPERS
// ─────────────────────────────────────
export function getSession() {
  return JSON.parse(localStorage.getItem("erms_user") || "null");
}

export function getCurrentRole() {
  return localStorage.getItem("erms_role") || null;
}

export async function apiVerifyEmail(userId, code) {
  if (!USE_MOCK) {
    const data = await _http("POST", "/auth/verify-email", { userId, code });
    localStorage.setItem("erms_token", data.token);
    localStorage.setItem("erms_role",  data.user.role);
    localStorage.setItem("erms_user",  JSON.stringify(data.user));
    return data;
  }
  await delay(200);
  const user = JSON.parse(localStorage.getItem("erms_user") || "null");
  if (!user) throw new Error("User not found.");
  const token = "mock_token_" + Date.now();
  localStorage.setItem("erms_token", token);
  return { token, user };
}

export async function apiResendOtp(userId) {
  if (!USE_MOCK) return _http("POST", "/auth/resend-otp", { userId });
  await delay(200);
  return { message: "Code resent." };
}

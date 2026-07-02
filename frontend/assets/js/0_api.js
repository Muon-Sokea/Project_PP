// ─────────────────────────────────────
// 0_api.js — Mock data layer (no backend required)
// Uses localStorage for all persistence.
// Used by: ALL JS files
// ─────────────────────────────────────

var API_BASE = "http://127.0.0.1:8000/api";
var USE_MOCK = true;

// ─────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────
function _getAttendees() {
  try { return JSON.parse(localStorage.getItem('erms_attendees') || '[]'); } catch(e) { return []; }
}
function _saveAttendees(a) { localStorage.setItem('erms_attendees', JSON.stringify(a)); }

function _getEvents() {
  var stored = [];
  try { stored = JSON.parse(localStorage.getItem('erms_events') || '[]'); } catch(e) {}
  if (stored.length) return stored;
  return (typeof mockEvents !== 'undefined') ? mockEvents : [];
}
function _saveEvents(e) { localStorage.setItem('erms_events', JSON.stringify(e)); }

function _getTickets() {
  try { return JSON.parse(localStorage.getItem('erms_tickets') || '[]'); } catch(e) { return []; }
}
function _saveTickets(t) { localStorage.setItem('erms_tickets', JSON.stringify(t)); }

function _getTestimonials() {
  try { return JSON.parse(localStorage.getItem('erms_testimonials') || '[]'); } catch(e) { return []; }
}

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────
function getAuthHeaders() {
  var token = localStorage.getItem('erms_token');
  return {
    'Content-Type':  'application/json',
    'Authorization': 'Token ' + (token || ''),
    'Accept':        'application/json'
  };
}

function mapUser(u) {
  var roleMap = { admin: 'Admin', organizer: 'Organizer', attendee: 'Attendee', superadmin: 'Supervisor', user: 'Attendee' };
  return {
    id:        u.id,
    firstName: u.first_name || u.firstName,
    lastName:  u.last_name  || u.lastName,
    email:     u.email,
    role:      roleMap[u.role] || u.role || 'Attendee',
    status:    u.status || 'active',
  };
}

// ─────────────────────────────────────
// AUTH API (mock)
// ─────────────────────────────────────
function apiLogin(email, password, callback) {
  var base = (typeof specificUsers !== 'undefined') ? specificUsers : [];
  var allUsers = base.concat(_getAttendees());
  var user = allUsers.find(function(u) { return (u.email || '').toLowerCase() === email.toLowerCase(); });
  if (!user || user.password !== password) {
    setTimeout(function() { callback('Invalid email or password.', null); }, 300);
    return;
  }
  var token = 'mock_token_' + Date.now();
  var u = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, status: 'active' };
  localStorage.setItem('erms_token', token);
  localStorage.setItem('erms_role',  u.role);
  localStorage.setItem('erms_user',  JSON.stringify(u));
  setTimeout(function() { callback(null, { token: token, user: u }); }, 300);
}

function apiRegister(userData, callback) {
  var attendees = _getAttendees();
  if (attendees.some(function(u) { return u.email.toLowerCase() === userData.email.toLowerCase(); })) {
    setTimeout(function() { callback('An account with this email already exists.', null); }, 300);
    return;
  }
  var newUser = {
    id:        Date.now(),
    firstName: userData.firstName,
    lastName:  userData.lastName,
    email:     userData.email,
    password:  userData.password,
    phone:     userData.phone || '',
    role:      'Attendee',
    status:    'active'
  };
  attendees.push(newUser);
  _saveAttendees(attendees);
  setTimeout(function() { callback(null, { pending_verification: false, user: newUser }); }, 300);
}

function apiVerifyEmail(userId, code, callback) {
  var user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  if (!user) { setTimeout(function() { callback('User not found.', null); }, 200); return; }
  var token = 'mock_token_' + Date.now();
  localStorage.setItem('erms_token', token);
  setTimeout(function() { callback(null, { token: token, user: user }); }, 200);
}

function apiResendOtp(userId, callback) {
  setTimeout(function() { callback(null, { message: 'Code resent.' }); }, 200);
}

function apiLogout(callback) {
  localStorage.removeItem('erms_user');
  localStorage.removeItem('erms_role');
  localStorage.removeItem('erms_token');
  if (callback) callback();
}

// ─────────────────────────────────────
// EVENTS API (mock)
// ─────────────────────────────────────
function apiGetEvents(callback) {
  setTimeout(function() { callback(null, _getEvents()); }, 100);
}

function apiGetEventById(id, callback) {
  var ev = _getEvents().find(function(e) { return String(e.id) === String(id); });
  if (!ev) { setTimeout(function() { callback('Event not found', null); }, 100); return; }
  setTimeout(function() { callback(null, ev); }, 100);
}

function apiCreateEvent(eventData, callback) {
  var events = _getEvents();
  var newEvent = Object.assign({ id: Date.now(), status: 'published' }, eventData);
  events.push(newEvent);
  _saveEvents(events);
  setTimeout(function() { callback(null, newEvent); }, 200);
}

function apiUpdateEvent(id, eventData, callback) {
  var events = _getEvents();
  var idx = events.findIndex(function(e) { return String(e.id) === String(id); });
  if (idx !== -1) { events[idx] = Object.assign({}, events[idx], eventData); _saveEvents(events); }
  if (callback) setTimeout(function() { callback(null, events[idx]); }, 200);
}

function apiDeleteEvent(id, callback) {
  var events = _getEvents().filter(function(e) { return String(e.id) !== String(id); });
  _saveEvents(events);
  if (callback) setTimeout(function() { callback(null); }, 200);
}

function apiTogglePublish(id, callback) {
  var events = _getEvents();
  var ev = events.find(function(e) { return String(e.id) === String(id); });
  if (ev) { ev.status = ev.status === 'published' ? 'draft' : 'published'; _saveEvents(events); }
  if (callback) setTimeout(function() { callback(null, ev); }, 200);
}

// ─────────────────────────────────────
// TICKETS / REGISTRATIONS API (mock)
// ─────────────────────────────────────
function apiGetMyRegistrations(callback) {
  var user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  var tickets = _getTickets();
  var mine = user ? tickets.filter(function(t) { return t.userId === user.id; }) : [];
  setTimeout(function() { callback(null, mine); }, 100);
}

function apiRegisterForEvent(eventId, formData, callback) {
  var user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  if (!user) { setTimeout(function() { callback('Not logged in.', null); }, 100); return; }
  var ev = _getEvents().find(function(e) { return String(e.id) === String(eventId); });
  var ticketCode = 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  var ticket = {
    id:           Date.now(),
    userId:       user.id,
    event:        eventId,
    event_title:  ev ? ev.title : 'Event',
    ticket_code:  ticketCode,
    ticket_type:  formData.ticketType || 'standard',
    quantity:     formData.quantity   || 1,
    unit_price:   formData.price      || '0.00',
    status:       'confirmed',
    registered_at: new Date().toISOString()
  };
  var tickets = _getTickets();
  tickets.push(ticket);
  _saveTickets(tickets);
  localStorage.setItem('erms_ticket_id',    ticket.id);
  localStorage.setItem('erms_from_payment', 'true');
  setTimeout(function() { callback(null, ticket); }, 200);
}

function apiRequestRefund(ticketId, reason, callback) {
  var tickets = _getTickets();
  var t = tickets.find(function(t) { return String(t.id) === String(ticketId); });
  if (t) { t.status = 'cancelled'; _saveTickets(tickets); }
  if (callback) setTimeout(function() { callback(null, t); }, 200);
}

function apiGetTicket(ticketId, callback) {
  var t = _getTickets().find(function(t) { return String(t.id) === String(ticketId); });
  if (!t) { setTimeout(function() { callback('Ticket not found', null); }, 100); return; }
  setTimeout(function() { callback(null, t); }, 100);
}

// ─────────────────────────────────────
// TESTIMONIALS API (mock)
// ─────────────────────────────────────
function apiGetTestimonials(callback) {
  setTimeout(function() { callback(null, _getTestimonials()); }, 100);
}

function apiSubmitTestimonial(content, rating, eventId, callback) {
  var user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  var t = { id: Date.now(), content: content, rating: rating, event: eventId || null, user: user ? user.firstName : 'Anonymous' };
  var testimonials = _getTestimonials();
  testimonials.push(t);
  localStorage.setItem('erms_testimonials', JSON.stringify(testimonials));
  if (callback) setTimeout(function() { callback(null, t); }, 200);
}

// ─────────────────────────────────────
// USERS API (mock — admin only)
// ─────────────────────────────────────
function apiGetAllUsers(callback) {
  var base = (typeof specificUsers !== 'undefined') ? specificUsers : [];
  var all = base.concat(_getAttendees());
  setTimeout(function() { callback(null, all); }, 100);
}

function apiUpdateUser(userId, data, callback) {
  var attendees = _getAttendees();
  var idx = attendees.findIndex(function(u) { return String(u.id) === String(userId); });
  if (idx !== -1) { attendees[idx] = Object.assign({}, attendees[idx], data); _saveAttendees(attendees); }
  if (callback) setTimeout(function() { callback(null, attendees[idx]); }, 200);
}

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────
function handleApiError(err) {
  if (err === 'Unauthorized' || err === '401') {
    localStorage.removeItem('erms_user');
    localStorage.removeItem('erms_role');
    localStorage.removeItem('erms_token');
    if (localStorage.getItem('erms_was_logged_in')) {
      window.location.href = '2_login.html';
    }
  }
}

function getCurrentRole() {
  return localStorage.getItem('erms_role') || null;
}

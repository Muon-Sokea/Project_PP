// ─────────────────────────────────────
// 4_dashboard.js — Mock dashboard (no backend required)
// Uses localStorage for all data.
// ─────────────────────────────────────
import { apiDeleteEvent, getCurrentRole } from '/assets/js/Fakedata/api.js';

// ── Tab switching ──
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const content = document.getElementById(tabId);
  const button  = document.querySelector(`[data-tab="${tabId}"]`);
  if (content) content.classList.add('active');
  if (button)  button.classList.add('active');
}

// ── Render attendee registrations ──
function renderMyRegistrations() {
  const grid = document.getElementById('myEventsGrid');
  if (!grid) return;

  const user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  const tickets = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  const myTickets = user ? tickets.filter(t => t.userId === user.id) : [];

  if (myTickets.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>You have no registrations yet.</p></div>';
    return;
  }

  grid.innerHTML = myTickets.map(reg => {
    const eventTitle = reg.event_title || 'Untitled Event';
    const eventDate  = reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '';
    const ticketCode = reg.ticket_code || '';
    const status     = reg.status;
    return `
    <div class="event-list-item">
      <div class="event-list-img">
        <img src="/assets/images/Sport event.jpg" alt="${eventTitle}" onerror="this.src='../assets/images/Sport event.jpg'" />
        <span class="price-tag">Ticket</span>
      </div>
      <div class="event-list-info">
        <div class="event-list-header">
          <span class="badge badge-${status === 'confirmed' ? 'confirmed' : status}">${status}</span>
          <span class="ticket-id">Ticket: ${ticketCode}</span>
        </div>
        <h3>${eventTitle}</h3>
        <div class="event-meta" style="margin-top:6px">
          <div class="event-meta-item">
            <i class="ri-calendar-line"></i> Registered: ${eventDate}
          </div>
        </div>
        <div class="event-list-actions">
          <button class="btn btn-primary btn-sm" onclick="viewQRTicket(${reg.id}, '${ticketCode}')">
            <i class="ri-qr-code-line"></i> View QR Ticket
          </button>
          <button class="btn btn-outline btn-sm" onclick="downloadTicket('${ticketCode}')">
            <i class="ri-download-line"></i> Download
          </button>
          <button class="btn btn-danger btn-sm" onclick="requestRefund(${reg.id})">
            <i class="ri-close-circle-line"></i> Cancel Registration
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Render admin/organizer dashboard stats ──
function renderAdminDashboard() {
  const tickets   = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  const attendees = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
  const events    = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const allEvents = (typeof mockEvents !== 'undefined' && !events.length) ? mockEvents : events;

  const now = new Date();
  const upcoming = allEvents.filter(e => new Date(e.date) >= now).length;

  const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setStat('statTotalEvents',         allEvents.length);
  setStat('statTotalRegistrations',  tickets.length);
  setStat('statTotalUsers',          attendees.length);
  setStat('statUpcomingEvents',      upcoming);

  const role = getCurrentRole();
  if (role === 'Organizer') {
    const grid = document.getElementById('myEventsGrid');
    if (grid && allEvents.length > 0) {
      grid.innerHTML = allEvents.map(e => `
        <div class="event-list-item">
          <div class="event-list-img">
            <img src="${e.image || '/assets/images/Sport event.jpg'}" alt="${e.title}" onerror="this.src='../assets/images/Sport event.jpg'" />
            <span class="price-tag">$${e.price || 0}</span>
          </div>
          <div class="event-list-info">
            <h3>${e.title}</h3>
            <div class="event-meta">
              <div class="event-meta-item"><i class="ri-calendar-line"></i> ${e.date}</div>
              <div class="event-meta-item"><i class="ri-map-pin-line"></i> ${e.location}</div>
            </div>
            <div class="event-list-actions">
              <button class="btn btn-primary btn-sm" onclick="editEvent(${e.id})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteEvent(${e.id})">Delete</button>
            </div>
          </div>
        </div>`).join('');
    }
  }
}

// ── Ticket actions ──
function viewQRTicket(registrationId, ticketCode) {
  localStorage.setItem('erms_registration_id', registrationId);
  localStorage.setItem('erms_ticket_code', ticketCode);
  window.location.href = '/pages/10_ticket.html';
}

function downloadTicket(ticketId) {
  alert('Downloading ticket: ' + ticketId);
}

function requestRefund(registrationId) {
  if (!confirm('Are you sure you want to cancel this registration?')) return;
  var tickets = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  var t = tickets.find(t => String(t.id) === String(registrationId));
  if (t) { t.status = 'cancelled'; localStorage.setItem('erms_tickets', JSON.stringify(tickets)); }
  alert('Registration cancelled successfully.');
  renderMyRegistrations();
}

// ── Organizer actions ──
function editEvent(id)   { alert('Edit event ' + id); }
async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  await apiDeleteEvent(id);
  alert('Event ' + id + ' deleted.');
  renderAdminDashboard();
}

// ── Tab switching for upcoming/past events ──
let allRegistrations = [];

function renderMyRegistrationsWithFilter() {
  const user    = JSON.parse(localStorage.getItem('erms_user') || 'null');
  const tickets = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  allRegistrations = user ? tickets.filter(t => t.userId === user.id) : [];
  switchEventTab('upcoming');
}

function switchEventTab(type, button) {
  if (button) {
    document.querySelectorAll('.tab-filter-btn').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
  }

  const grid = document.getElementById('myEventsGrid');
  if (!grid) return;

  const now = new Date();
  let filtered = [];

  if (type === 'upcoming') {
    filtered = allRegistrations.filter(reg => new Date(reg.registered_at) >= now);
  } else if (type === 'past') {
    filtered = allRegistrations.filter(reg => new Date(reg.registered_at) < now);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No ${type} events found.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(reg => {
    const eventTitle = reg.event_title || 'Untitled Event';
    const eventDate  = reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '';
    const ticketCode = reg.ticket_code || '';
    const status     = reg.status;
    return `
    <div class="event-list-item">
      <div class="event-list-img">
        <img src="/assets/images/Sport event.jpg" alt="${eventTitle}" onerror="this.src='../assets/images/Sport event.jpg'" />
        <span class="price-tag">Ticket</span>
      </div>
      <div class="event-list-info">
        <div class="event-list-header">
          <span class="badge badge-${status === 'confirmed' ? 'confirmed' : status}">${status}</span>
          <span class="ticket-id">Ticket: ${ticketCode}</span>
        </div>
        <h3>${eventTitle}</h3>
        <div class="event-meta" style="margin-top:6px">
          <div class="event-meta-item">
            <i class="ri-calendar-line"></i> Registered: ${eventDate}
          </div>
        </div>
        <div class="event-list-actions">
          <button class="btn btn-primary btn-sm" onclick="viewQRTicket(${reg.id}, '${ticketCode}')">
            <i class="ri-qr-code-line"></i> View QR Ticket
          </button>
          <button class="btn btn-outline btn-sm" onclick="downloadTicket('${ticketCode}')">
            <i class="ri-download-line"></i> Download
          </button>
          <button class="btn btn-danger btn-sm" onclick="requestRefund(${reg.id})">
            <i class="ri-close-circle-line"></i> Cancel Registration
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const role = getCurrentRole();
  if (!role) {
    window.location.href = ' 2_login.html';
    return;
  }

  if (role === 'Attendee') {
    if (typeof initAttendeeDashboard === 'function') {
      initAttendeeDashboard();
    } else {
      renderMyRegistrationsWithFilter();
    }
  } else {
    renderAdminDashboard();
  }
});

window.switchTab               = switchTab;
window.renderMyRegistrations   = renderMyRegistrations;
window.renderAdminDashboard    = renderAdminDashboard;
window.viewQRTicket            = viewQRTicket;
window.downloadTicket          = downloadTicket;
window.requestRefund           = requestRefund;
window.editEvent               = editEvent;
window.deleteEvent             = deleteEvent;
window.switchEventTab          = switchEventTab;

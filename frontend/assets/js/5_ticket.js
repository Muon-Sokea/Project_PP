// ─────────────────────────────────────
// 5_ticket.js — QR ticket (MOCK mode)
// Used by: 10_ticket.html
// Reads ticket data from localStorage; no backend required.
// ─────────────────────────────────────

function loadQRLibrary() {
  return new Promise((resolve) => {
    if (window.QRCode) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

async function generateQRCode(text) {
  await loadQRLibrary();
  const container = document.getElementById('qrCodeContainer');
  if (!container) return;
  container.innerHTML = '';
  new QRCode(container, {
    text: text,
    width: 176,
    height: 176,
    colorDark: '#222222',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ── Build ticket details from localStorage (set by the dashboard / payment flow) ──
function getStoredTicket() {
  const code = localStorage.getItem('erms_ticket_code')
            || localStorage.getItem('erms_ticket_id');
  if (!code) return null;

  // Prefer the event explicitly attached to this ticket (from the dashboard);
  // fall back to the last-viewed event (set during the register/payment flow).
  let evt = {};
  try {
    evt = JSON.parse(
      localStorage.getItem('erms_ticket_event')
      || localStorage.getItem('erms_selected_event')
      || '{}'
    );
  } catch (e) {}
  let user = {};
  try { user = JSON.parse(localStorage.getItem('erms_user') || '{}'); } catch (e) {}

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    ticket_code: code,
    event_title: evt.title    || 'Your Event',
    date:        evt.date      || '',
    time:        evt.time      || '',
    location:    evt.location  || '',
    attendee:    name || user.email || 'Attendee'
  };
}

function loadTicketDetails(t) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };
  set('ticketIdDisplay',  t.ticket_code);
  set('ticketEventTitle', t.event_title);
  set('ticketAttendee',   'Attendee: ' + t.attendee);
  set('ticketDate',       t.date);
  set('ticketTime',       t.time);
  set('ticketLocation',   t.location);
}

document.addEventListener('DOMContentLoaded', async () => {
  const ticket = getStoredTicket();

  if (!ticket) {
    const view = document.getElementById('ticketView');
    if (view) {
      view.innerHTML =
        '<div class="ticket-page"><div class="ticket-card">' +
        '<p style="text-align:center;padding:20px">No ticket selected. ' +
        'Please register for an event first.</p></div></div>';
    }
    return;
  }

  // Coming straight from payment? Show the success screen first.
  if (localStorage.getItem('erms_from_payment') === 'true') {
    const success = document.getElementById('successScreen');
    const view    = document.getElementById('ticketView');
    if (success && view) {
      success.style.display = 'block';
      view.style.display    = 'none';
    }
    localStorage.removeItem('erms_from_payment');
  }

  loadTicketDetails(ticket);
  await generateQRCode(ticket.ticket_code);

  const dl = document.getElementById('downloadBtn');
  if (dl) dl.addEventListener('click', () => {
    const card = document.getElementById('ticketCard');
    if (!card) return;
    const style = document.createElement('style');
    style.id = '_print_style';
    style.textContent = `
      @media print {
        body > *:not(#ticketView) { display: none !important; }
        #ticketView { display: block !important; }
        .navbar, #downloadBtn, .btn-outline { display: none !important; }
        .ticket-card { box-shadow: none !important; border: 2px solid #ccc; }
      }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => { const s = document.getElementById('_print_style'); if (s) s.remove(); }, 1000);
  });
});

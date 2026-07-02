import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGetTicket } from '../services/api.js';
import '../../assets/css/1_global.css';
import './TicketPage.css';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getStoredTicket() {
  try {
    const code     = localStorage.getItem('erms_ticket_code');
    const rawEvent = localStorage.getItem('erms_ticket_event') || localStorage.getItem('erms_selected_event');
    const user     = JSON.parse(localStorage.getItem('erms_user') || 'null');
    let event = null;
    if (rawEvent) {
      try   { event = JSON.parse(rawEvent); }
      catch { event = { title: rawEvent };  }
    }
    return { code, event, user };
  } catch {
    return { code: null, event: null, user: null };
  }
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function TicketPage() {
  const qrRef         = useRef(null);
  const ticketCardRef = useRef(null);

  const [fromPayment, setFromPayment] = useState(false);
  const [ticket,      setTicket]      = useState({ code: null, event: null, user: null });
  const [qrReady,     setQrReady]     = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fp = localStorage.getItem('erms_from_payment') === 'true';
    setFromPayment(fp);
    if (fp) localStorage.removeItem('erms_from_payment');
    const stored = getStoredTicket();
    setTicket(stored);

    // If we have a ticket code, try to enrich from the API
    if (stored.code) {
      apiGetTicket(stored.code)
        .then(apiTicket => {
          // API returns { ticketCode, event: { title, date, location, ... }, user: { firstName, lastName, email } }
          setTicket(prev => ({
            code: prev.code,
            event: apiTicket.event || prev.event,
            user: apiTicket.user
              ? { firstName: apiTicket.user.firstName, lastName: apiTicket.user.lastName, email: apiTicket.user.email }
              : prev.user,
          }));
        })
        .catch(() => {}); // silently fall back to localStorage data
    }
  }, []);

  /* Render QR code onto hidden canvas */
  useEffect(() => {
    if (!ticket.code) return;
    import('qrcode').then(({ default: QRCode }) => {
      if (!qrRef.current) return;
      QRCode.toCanvas(qrRef.current, ticket.code, { width: 160, margin: 1 }, err => {
        if (!err) setQrReady(true);
      });
    }).catch(() => setQrReady(false));
  }, [ticket.code]);

  /* ── PDF download ─────────────────────────────────────────────────────── */
  async function handleDownload() {
    const card = ticketCardRef.current;
    if (!card || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#1a1a2e',
        ignoreElements: el => el.classList.contains('ticket-actions'),
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const ratio   = canvas.height / canvas.width;
      const drawW   = pageW - 20; // 10mm margin each side
      const drawH   = drawW * ratio;
      const offsetY = Math.max(10, (pageH - drawH) / 2);

      // Dark background for the whole page
      pdf.setFillColor(26, 26, 46);
      pdf.rect(0, 0, pageW, pageH, 'F');

      pdf.addImage(imgData, 'PNG', 10, offsetY, drawW, drawH);
      pdf.save(`ticket-${ticket.code || 'download'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  /* ── Derived data ─────────────────────────────────────────────────────── */
  const ev            = ticket.event;
  const userName      = ticket.user
    ? `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email
    : 'Guest';
  const eventTitle    = (ev && typeof ev === 'object' ? ev.title : ev) || 'Event';
  const eventDate     = fmtDate(ev?.date);
  const eventTime     = ev?.time || fmtTime(ev?.date);
  const eventLocation = ev?.location || '';
  const eventImage    = (ev && typeof ev === 'object' ? ev.image : null) || '';

  /* ── Success screen (post-payment) ────────────────────────────────────── */
  if (fromPayment) {
    return (
      <div className="ticket-page">
        <div className="ticket-card-wrapper">
          <div className="ticket-success">
            <div className="ticket-success-icon">
              <i className="ri-checkbox-circle-fill" />
            </div>
            <h2>Registration Successful!</h2>
            <p>Your registration has been confirmed. Your ticket is ready to view.</p>
            <button className="btn btn-primary btn-full" onClick={() => setFromPayment(false)}>
              <i className="ri-ticket-2-line" /> View My Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main ticket view ─────────────────────────────────────────────────── */
  return (
    <div className="ticket-page">
      <div className="ticket-card" ref={ticketCardRef}>

        {/* ── Top accent bar ── */}
        <div className="ticket-accent-bar" />

        {/* ── Header ── */}
        <div className="ticket-header">
          {eventImage && (
            <div className="ticket-header-image">
              <img
                src={eventImage}
                alt={eventTitle}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <div className="ticket-header-brand">
            <i className="ri-ticket-2-fill" />
            <span>ERMS</span>
          </div>
          <h2 className="ticket-event-title">{eventTitle}</h2>
          <div className="ticket-subtitle">Event Ticket</div>
        </div>

        {/* ── QR Section ── */}
        <div className="ticket-qr-section">
          <div className="ticket-qr-frame">
            {ticket.code ? (
              <>
                <canvas
                  ref={qrRef}
                  className="ticket-qr-canvas"
                  style={{ display: qrReady ? 'block' : 'none' }}
                />
                {!qrReady && (
                  <div className="ticket-qr-placeholder">
                    <i className="ri-qr-code-line" />
                  </div>
                )}
              </>
            ) : (
              <div className="ticket-qr-placeholder">
                <i className="ri-qr-code-line" />
              </div>
            )}
          </div>
          {ticket.code && <div className="ticket-code-badge">{ticket.code}</div>}
        </div>

        {/* ── Dashed divider with notches ── */}
        <div className="ticket-divider-line">
          <div className="ticket-notch ticket-notch-left" />
          <div className="ticket-notch ticket-notch-right" />
        </div>

        {/* ── Detail grid ── */}
        <div className="ticket-details">
          <div className="ticket-detail-item">
            <div className="ticket-detail-icon"><i className="ri-user-3-line" /></div>
            <div className="ticket-detail-content">
              <span className="ticket-detail-label">Attendee</span>
              <span className="ticket-detail-value">{userName}</span>
            </div>
          </div>

          {eventDate && (
            <div className="ticket-detail-item">
              <div className="ticket-detail-icon"><i className="ri-calendar-line" /></div>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Date</span>
                <span className="ticket-detail-value">{eventDate}</span>
              </div>
            </div>
          )}

          {eventTime && (
            <div className="ticket-detail-item">
              <div className="ticket-detail-icon"><i className="ri-time-line" /></div>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Time</span>
                <span className="ticket-detail-value">{eventTime}</span>
              </div>
            </div>
          )}

          {eventLocation && (
            <div className="ticket-detail-item">
              <div className="ticket-detail-icon"><i className="ri-map-pin-line" /></div>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Location</span>
                <span className="ticket-detail-value">{eventLocation}</span>
              </div>
            </div>
          )}

          <div className="ticket-detail-item">
            <div className="ticket-detail-icon"><i className="ri-tag-line" /></div>
            <div className="ticket-detail-content">
              <span className="ticket-detail-label">Ticket Type</span>
              <span className="ticket-detail-value">General Admission</span>
            </div>
          </div>

          <div className="ticket-detail-item">
            <div className="ticket-detail-icon"><i className="ri-checkbox-circle-line" /></div>
            <div className="ticket-detail-content">
              <span className="ticket-detail-label">Status</span>
              <span className="ticket-detail-value ticket-status-confirmed">Confirmed ✓</span>
            </div>
          </div>
        </div>

        {/* ── Instructions ── */}
        <div className="ticket-instructions-box">
          <div className="ticket-instructions-header">
            <i className="ri-information-line" />
            <span>Instructions</span>
          </div>
          <ul className="ticket-instructions-list">
            <li>Present this QR code at the venue entrance for check-in.</li>
            <li>Screenshot or download this ticket to keep it handy.</li>
            <li>Each ticket is valid for one entry only.</li>
            <li>For support, contact the event organizer.</li>
          </ul>
        </div>

        {/* ── Footer ── */}
        <div className="ticket-footer">
          <span>Planning Center</span>
          <span>•</span>
          <span>Powered by ERMS</span>
        </div>

        {/* ── Actions (excluded from PDF via ignoreElements) ── */}
        <div className="ticket-actions">
          <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
            <i className="ri-download-line" />
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
          <Link to="/dashboard" className="btn btn-outline">
            <i className="ri-arrow-left-line" /> Back
          </Link>
        </div>
      </div>
    </div>
  );
}

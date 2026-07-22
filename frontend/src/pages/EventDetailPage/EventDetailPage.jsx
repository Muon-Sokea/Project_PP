import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiGetEventById } from '../../services/event.service.js';
import { useScrollListener } from '../../hooks/useScrollListener.js';
import { useToast } from '../../hooks/useToast.js';
import { fmtDate } from '../../utils/formatDate.js';
import { initials } from '../../utils/initials.js';
import generateDefaultSchedule from '../../utils/generateSchedule.js';
import { downloadEventICS } from '../../utils/generateICS.js';
import '../../../assets/css/1_global.css';
import '../../../assets/css/2_navbar.css';
import './EventDetailPage.css';

const ROLE_ROUTES = {
  Supervisor: '/superadmin', Admin: '/admin',
  Organizer:  '/organizer',  Attendee: '/dashboard',
};

const DEFAULT_HIGHLIGHTS = [
  'Expert speakers and engaging sessions',
  'Hands-on, interactive experiences',
  'Networking with fellow attendees',
  'Exclusive announcements and demos',
  'Certificate of attendance',
];

export default function EventDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user, role, logout } = useAuth();

  const [event,       setEvent]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saved,       setSaved]       = useState(false);
  const [agendaDay,   setAgendaDay]   = useState(null);
  const [showMap,     setShowMap]     = useState(false);
  const [toast,       showToast]      = useToast();
  const [navOpen,     setNavOpen]     = useState(false);
  const navScrolled = useScrollListener();

  // ── Load event ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // Try localStorage first (set by EventsPage click)
      let ev = null;
      try {
        const stored = JSON.parse(localStorage.getItem('erms_selected_event') || 'null');
        if (stored && String(stored.id) === String(id)) ev = stored;
      } catch {}

      if (!ev) {
        try { ev = await apiGetEventById(id); } catch {}
      }
      if (ev) {
        // Generate default schedule if none exists (create new object to avoid mutation)
        let evFinal = { ...ev };
        if (!evFinal.agenda || !Object.keys(evFinal.agenda).length) {
          const defaultAgenda = generateDefaultSchedule(evFinal);
          if (defaultAgenda) evFinal.agenda = defaultAgenda;
        }
        setEvent(evFinal);
        document.title = `Planning Center — ${ev.title || 'Event'}`;
        const days = evFinal.agenda ? Object.keys(evFinal.agenda) : [];
        if (days.length) setAgendaDay(days[0]);
        const savedList = getSavedList();
        setSaved(savedList.includes(evFinal.id));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Toast is now handled by useToast() hook

  // ── Saved events ──────────────────────────────────────────────────────────
  function getSavedList() {
    try { return JSON.parse(localStorage.getItem('erms_saved_events') || '[]'); } catch { return []; }
  }
  function toggleSave() {
    if (!event) return;
    let list = getSavedList();
    if (list.includes(event.id)) {
      list = list.filter(i => i !== event.id);
      setSaved(false);
      showToast('Removed from saved');
    } else {
      list.push(event.id);
      setSaved(true);
      showToast('Saved to your list');
    }
    localStorage.setItem('erms_saved_events', JSON.stringify(list));
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  function shareEvent() {
    const url = window.location.href;
    if (navigator.share) { navigator.share({ title: document.title, url }).catch(() => {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showToast('Link copied'))
        .catch(() => showToast(url));
    } else {
      showToast(url);
    }
  }

  // ── Add to Calendar ───────────────────────────────────────────────────────
  function addToCalendar() {
    if (!event) return;
    const ok = downloadEventICS(event, msg => showToast(msg));
    if (ok) showToast('Calendar file downloaded');
  }

  // ── Register ──────────────────────────────────────────────────────────────
  function goRegister() {
    if (!user) { navigate('/login'); return; }
    if (event) localStorage.setItem('erms_selected_event', JSON.stringify(event));
    showToast('Taking you to registration…');
    setTimeout(() => navigate('/event-registration'), 700);
  }

  function joinWaitlist() {
    if (!user) { navigate('/login'); return; }
    const waitlist = (() => { try { return JSON.parse(localStorage.getItem('erms_waitlist') || '[]'); } catch { return []; } })();
    const already  = waitlist.some(w => w.eventId === event.id && w.userId === user.id);
    if (already) { showToast("You're already on the waitlist!"); return; }
    waitlist.push({ id: Date.now(), userId: user.id, eventId: event.id, eventTitle: event.title, joinedAt: new Date().toISOString(), status: 'waiting' });
    localStorage.setItem('erms_waitlist', JSON.stringify(waitlist));
    showToast("Added to waitlist! We'll notify you when a spot opens.");
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const attending = event ? (Number(event.attending) || Number(event.registered) || 0) : 0;
  const capacity  = event ? (Number(event.capacity) || 1) : 1;
  const fillPct   = Math.min(100, Math.round((attending / capacity) * 100));
  const seatsLeft = capacity - attending;
  const isFull    = attending >= capacity;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const evDate    = event ? new Date(event.date) : null;
  const isPast    = evDate && !isNaN(evDate.getTime()) && evDate < today;
  const fillColor = (isFull || isPast) ? 'var(--danger)' : 'var(--success)';
  const seatLabel = isPast ? 'Event ended' : (seatsLeft > 0 ? `${seatsLeft.toLocaleString()} seats left` : 'No seats left');
  const btnLabel  = isPast ? 'Event ended' : (isFull ? 'Join Waitlist' : 'Register Now');
  const btnDisabled = isPast;
  const isWaitlist  = !isPast && isFull;
  const highlights  = event?.highlights || null;
  const agendaDays  = event?.agenda ? Object.keys(event.agenda) : [];
  const agendaItems = event?.agenda && agendaDay ? (event.agenda[agendaDay] || []) : [];

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <>
        <nav className="navbar">
          <Link className="nav-logo" to="/"><span className="logo-top">Planning</span><span className="logo-bottom">Center</span></Link>
        </nav>
        <div style={{ textAlign:'center', padding:'80px 24px' }}>
          <h2>Event not found</h2>
          <p style={{ color:'var(--text-medium)', margin:'12px 0 24px' }}>This event may have been removed or the link is invalid.</p>
          <Link to="/" className="btn btn-primary"><i className="ri-arrow-left-line" /> Back to Events</Link>
        </div>
      </>
    );
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || '')}`;

  return (
    <>
      <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
        <Link className="nav-logo" to="/"><span className="logo-top">Planning</span><span className="logo-bottom">Center</span></Link>
        <button className="hamburger" onClick={() => setNavOpen(o => !o)}><span /><span /><span /></button>
        <div className={`nav-links${navOpen ? ' open' : ''}`}>
          <Link to="/" className="btn btn-primary"><i className="ri-home-line" /> Home</Link>
          {user
            ? <button className="btn btn-outline" onClick={() => navigate(ROLE_ROUTES[role] || '/')}><i className="ri-dashboard-line" /> Dashboard</button>
            : <Link to="/login" className="btn btn-outline"><i className="ri-login-box-line" /> Login</Link>}
          {user && <button className="btn btn-outline" onClick={logout}><i className="ri-logout-box-r-line" /> Logout</button>}
        </div>
      </nav>

      <main className="detail-page">
        <button className="back-link" onClick={() => navigate(-1)}>
          <i className="ri-arrow-left-line" /> All Events
        </button>

        <div className="detail-top">
          <div className="detail-img">
            <img src={event.image || '/images/Sport%20event.jpg'} alt={event.title} onError={e => { e.target.src = '/images/Sport%20event.jpg'; }} />
            <div className="detail-img-grad" />
            <span className="detail-cat-glass">{event.category}</span>
            <div className="detail-price-tag">${event.price}</div>
          </div>
          <div className="detail-info">
            <div>
              <h1>{event.title}</h1>
              <div className="detail-meta-list">
                <div className="detail-meta-item"><i className="ri-calendar-line" />              <span>{fmtDate(event.date, 'long')}</span></div>
                <div className="detail-meta-item"><i className="ri-time-line" /><span>{event.time}</span></div>
                <div className="detail-meta-item">
                  <i className="ri-map-pin-line" />
                  <a className="loc-link" href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <span>{event.location}</span>
                    <i className="ri-external-link-line" />
                  </a>
                </div>
              </div>
              <div className="price-row">
                <div className="detail-meta-item"><i className="ri-price-tag-3-line" /><span>${event.price} per ticket</span></div>
                <div className="detail-meta-item"><i className="ri-group-line" /><span>{attending.toLocaleString()} / {capacity.toLocaleString()} attendees</span></div>
              </div>
              <div className="avail-row">
                <span>Availability</span>
                <span>{seatLabel}</span>
              </div>
              <div className="avail-bar">
                <div className="avail-fill" style={{ width: `${fillPct}%`, background: fillColor }} />
              </div>
            </div>
            <div className="detail-actions">
              <button
                className="btn btn-primary reg-btn"
                style={{ flex:1, opacity: btnDisabled ? .6 : 1, cursor: btnDisabled ? 'not-allowed' : '', ...(isWaitlist ? { background:'var(--warning,#f59e0b)' } : {}) }}
                disabled={btnDisabled}
                onClick={isWaitlist ? joinWaitlist : goRegister}
              >
                {btnLabel}
              </button>
              <button className="share-btn" title="Add to calendar" onClick={addToCalendar}>
                <i className="ri-calendar-2-line" />
              </button>
            </div>
          </div>
        </div>

        <div className="detail-bottom">
          <div className="detail-left">
            {/* About */}
            <div className="detail-section">
              <div className="detail-section-title">
                <div className="icon-circle"><i className="ri-information-line" /></div>
                About This Event
              </div>
              <p>{event.description || 'Join us for one of the standout events of 2026. Connect with like-minded people, discover something new, and be part of an experience worth remembering.'}</p>
            </div>

            {/* Highlights */}
            <div className="detail-section">
              <div className="detail-section-title">
                <div className="icon-circle"><i className="ri-star-line" /></div>
                Event Highlights
              </div>
              {highlights ? (
                <div className="hl-grid">
                  {highlights.map((h, i) => (
                    <div className="hl-card" key={i}>
                      <div className="hl-icon"><i className={h.icon || 'ri-checkbox-circle-line'} /></div>
                      <div className="hl-title">{h.title}</div>
                      <div className="hl-desc">{h.desc || ''}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="highlights-list">
                  {DEFAULT_HIGHLIGHTS.map((h, i) => (
                    <div className="highlight-item" key={i}>
                      <div className="highlight-check"><i className="ri-check-line" /></div>
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agenda */}
            {agendaDays.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">
                  <div className="icon-circle"><i className="ri-calendar-todo-line" /></div>
                  Agenda
                </div>
                <div className="agenda-tabs">
                  {agendaDays.map(day => (
                    <button key={day} className={`agenda-tab${agendaDay === day ? ' active' : ''}`} onClick={() => setAgendaDay(day)}>{day}</button>
                  ))}
                </div>
                <div className="agenda-timeline">
                  {agendaItems.map((it, i) => (
                    <div className="agenda-item" key={i}>
                      <div className="agenda-time">{it.time}</div>
                      <div className="agenda-card">
                        <div className="a-title">{it.title}</div>
                        {it.sub && <div className="a-sub">{it.sub}</div>}
                        {it.tag && <span className="agenda-tag">{it.tag}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">
                  <div className="icon-circle"><i className="ri-user-star-line" /></div>
                  Featured Speakers
                </div>
                <div className="speakers-grid">
                  {event.speakers.map((s, i) => (
                    <div className="speaker" key={i}>
                      <div className="sp-avatar">
                        <span>{initials(s.name)}</span>
                      </div>
                      <div className="sp-name">{s.name}</div>
                      <div className="sp-title">{s.title || ''}</div>
                      <div className="sp-company">{s.company || ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue */}
            {event.venue && (
              <div className="detail-section">
                <div className="detail-section-title">
                  <div className="icon-circle"><i className="ri-map-pin-2-line" /></div>
                  Venue &amp; Location
                </div>
                <div className="venue-grid">
                  <div>
                    <div className="venue-name">{event.venue.name || ''}</div>
                    <div className="venue-addr">{event.venue.address || event.location || ''}</div>
                    {event.venue.parking     && <div className="venue-feat"><i className="ri-checkbox-circle-line" /> Free parking available</div>}
                    {event.venue.accessibility && <div className="venue-feat"><i className="ri-wheelchair-line" /> Wheelchair accessible</div>}
                  </div>
                  <a className="venue-map"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue.address || event.location || '')}`}
                    target="_blank" rel="noopener noreferrer">
                    <i className="ri-map-pin-line" /> View on Map
                  </a>
                </div>
              </div>
            )}

            {/* Embedded Map */}
            {event.location && (
              <div className="detail-section">
                <div className="detail-section-title">
                  <div className="icon-circle"><i className="ri-road-map-line" /></div>
                  Location Map
                </div>
                <div className="map-embed-wrapper">
                  {showMap ? (
                    <iframe
                      className="map-embed-iframe"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="350"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Event location map"
                    />
                  ) : (
                    <button className="map-placeholder-btn" onClick={() => setShowMap(true)}>
                      <div className="map-placeholder-inner">
                        <div className="map-placeholder-icon"><i className="ri-map-pin-2-line" /></div>
                        <span className="map-placeholder-title">Click to load map</span>
                        <span className="map-placeholder-addr"><i className="ri-map-pin-line" /> {event.location}</span>
                        <span className="map-placeholder-hint"><i className="ri-external-link-line" /> Opens in Google Maps</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="detail-right">
            <div className="organizer-card">
              <h3>Organizer</h3>
              <div className="organizer-field">
                <div className="f-label">Organized by</div>
                <div className="f-value">
                  {typeof event.organizer === 'object' && event.organizer
                    ? `${event.organizer.firstName} ${event.organizer.lastName}`
                    : (event.organizer || 'TechEvents Inc.')}
                </div>
              </div>
              <div className="organizer-field">
                <div className="f-label">Email</div>
                <a className="f-value" href={`mailto:${event.organizerEmail || 'contact@techevents.com'}`}>
                  {event.organizerEmail || 'contact@techevents.com'}
                </a>
              </div>
              {event.organizerPhone && (
                <div className="organizer-field">
                  <div className="f-label">Phone</div>
                  <a className="f-value" href={`tel:${event.organizerPhone}`}>{event.organizerPhone}</a>
                </div>
              )}
            </div>

            <div className="join-card">
              <h3>Ready to Join?</h3>
              <p>Secure your spot today and be part of this amazing event!</p>
              <button
                className="btn btn-primary btn-full reg-btn"
                style={{ opacity: btnDisabled ? .6 : 1, cursor: btnDisabled ? 'not-allowed' : '', ...(isWaitlist ? { background:'var(--warning,#f59e0b)' } : {}) }}
                disabled={btnDisabled}
                onClick={isWaitlist ? joinWaitlist : goRegister}
              >
                {btnLabel}
              </button>
            </div>

            <div className="share-save-row">
              <button className={`btn btn-outline${saved ? ' saved' : ''}`} onClick={toggleSave}>
                <i className={saved ? 'ri-heart-fill' : 'ri-heart-line'} /> {saved ? 'Saved' : 'Save'}
              </button>
              <button className="btn btn-outline" onClick={shareEvent}>
                <i className="ri-share-line" /> Share
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className={`ev-toast${toast.show ? ' show' : ''}`} role="status" aria-live="polite">{toast.msg}</div>
    </>
  );
}

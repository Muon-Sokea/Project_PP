import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiGetEvents, apiTogglePublish, apiDeleteEvent } from '../services/api.js';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import '../../assets/css/6_dashboard.css';
import './OrganizerDashboard.css';

const MOCK_EVENTS = [
  { id: 1, title: 'Tech Innovation Summit 2026', category: 'Technology', date: 'October 30, 2026',
    time: '9:00 AM - 5:00 PM', location: 'Prey Veng Province', image: '/images/Tech1.jpg',
    price: 250, capacity: 2300, registered: 1000, status: 'published',
    description: 'The premier technology conference of 2026 — AI, Web3 and sustainable tech.' },
  { id: 2, title: 'Digital Marketing Workshop', category: 'Education', date: 'September 20, 2026',
    time: '9:00 AM - 4:00 PM', location: 'Phnom Penh, RUPP', image: '/images/Business.webp',
    price: 100, capacity: 2000, registered: 1500, status: 'published',
    description: 'Hands-on workshop covering modern digital marketing strategy and tools.' },
  { id: 3, title: 'Networking & Innovation Forum', category: 'Networking', date: 'September 20, 2026',
    time: '10:00 AM - 5:00 PM', location: 'Phnom Penh, RUPP', image: '/images/Networking.jpg',
    price: 50, capacity: 2000, registered: 2000, status: 'draft',
    description: 'Connect with founders, investors and creators across the region.' },
];

const MOCK_ATTENDEES = [
  { id: 0, name: 'Dara Phon',     email: 'dara.phon@gmail.com',    ticket: 'General', date: 'Sep 2, 2026',  status: 'checked-in' },
  { id: 1, name: 'Mealea Sok',    email: 'mealea.sok@gmail.com',   ticket: 'VIP',     date: 'Sep 3, 2026',  status: 'pending' },
  { id: 2, name: 'Rithy Chan',    email: 'rithy.chan@gmail.com',   ticket: 'General', date: 'Sep 5, 2026',  status: 'checked-in' },
  { id: 3, name: 'Bopha Nuon',    email: 'bopha.nuon@gmail.com',   ticket: 'VIP',     date: 'Sep 6, 2026',  status: 'pending' },
  { id: 4, name: 'Visal Kong',    email: 'visal.kong@gmail.com',   ticket: 'General', date: 'Sep 8, 2026',  status: 'cancelled' },
  { id: 5, name: 'Channary Ros',  email: 'channary.ros@gmail.com', ticket: 'General', date: 'Sep 9, 2026',  status: 'checked-in' },
  { id: 6, name: 'Pisey Hang',    email: 'pisey.hang@gmail.com',   ticket: 'VIP',     date: 'Sep 10, 2026', status: 'pending' },
  { id: 7, name: 'Sokchea Lim',   email: 'sokchea.lim@gmail.com',  ticket: 'General', date: 'Sep 12, 2026', status: 'checked-in' },
];

const money = (n) => '$' + Number(n).toLocaleString();
const initials = (n) => n.split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();

const VIEW_META = {
  home:      { title: 'Organizer Dashboard',  sub: 'Manage your events and track performance' },
  event:     { title: 'Event Overview',        sub: 'Organizer view of your event' },
  edit:      { title: 'Edit Event',            sub: 'Update your event details' },
  attendees: { title: 'Attendees',             sub: 'Manage registrations and check-ins' },
};

function StatusBadge({ status }) {
  const map = { 'checked-in': 'badge-confirmed', pending: 'badge-pending', cancelled: 'badge-cancelled' };
  const label = status === 'checked-in' ? 'Checked-in' : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{label}</span>;
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Merge localStorage created events on init
  const [events, setEvents] = useState(() => {
    try {
      const created = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
      if (!Array.isArray(created) || !created.length) return MOCK_EVENTS;
      const byId = new Map(MOCK_EVENTS.map(e => [String(e.id), e]));
      created.forEach(e => byId.set(String(e.id), e));
      return Array.from(byId.values());
    } catch { return MOCK_EVENTS; }
  });

  const [attendees, setAttendees] = useState(MOCK_ATTENDEES);
  const [view, setView] = useState('home');
  const [currentEventId, setCurrentEventId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });
  const [attSearch, setAttSearch] = useState('');
  const [attFilter, setAttFilter] = useState('all');
  const [navOpen, setNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const toastTimer = useRef(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const apiEvents = await apiGetEvents();
        if (!apiEvents?.length) return;
        // Merge API events with any locally-created events, dedup by id (created wins)
        const created = (() => { try { return JSON.parse(localStorage.getItem('erms_created_events') || '[]'); } catch { return []; } })();
        const createdIds = new Set(created.map(e => String(e.id)));
        const base = apiEvents.filter(e => !createdIds.has(String(e.id)));
        const merged = [...base, ...created];
        setEvents(merged);
      } catch {}
    }
    loadEvents();
  }, []);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = deleteTarget ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [deleteTarget]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }

  function showView(name, id) {
    if (id !== undefined) setCurrentEventId(id);
    setView(name);
  }

  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId), [events, currentEventId]);

  // ── Home stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalReg = events.reduce((s, e) => s + e.registered, 0);
    const totalRev = events.reduce((s, e) => s + e.registered * e.price, 0);
    const avg      = events.length ? Math.round(totalReg / events.length) : 0;
    const published = events.filter(e => e.status === 'published').length;
    return [
      { label: 'Total Events',        value: events.length,          sub: `${published} published`,  icon: 'ri-file-list-3-line' },
      { label: 'Total Registrations', value: totalReg.toLocaleString(), sub: 'Across all events',     icon: 'ri-group-line' },
      { label: 'Total Revenue',       value: money(totalRev),        sub: 'Gross to date',           icon: 'ri-money-dollar-circle-line' },
      { label: 'Average Attendance',  value: avg.toLocaleString(),   sub: 'Per event',               icon: 'ri-bar-chart-line' },
    ];
  }, [events]);

  // ── Event actions ───────────────────────────────────────────────────────
  function togglePublish(id) {
    const ev = events.find(e => e.id === id);
    const nextStatus = ev?.status === 'published' ? 'draft' : 'published';
    setEvents(es => es.map(e => e.id === id ? { ...e, status: nextStatus } : e));
    apiTogglePublish(id).catch(() => {});
    showToast(nextStatus === 'published' ? 'Event published' : 'Event unpublished');
  }

  function duplicateEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const copy = { ...ev, id: Date.now(), title: 'Copy of ' + ev.title, status: 'draft', registered: 0 };
    const newEvents = [...events, copy];
    setEvents(newEvents);
    try {
      const stored = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
      stored.push(copy);
      localStorage.setItem('erms_created_events', JSON.stringify(stored));
    } catch {}
    showToast(`Event duplicated as draft: "${copy.title}"`);
  }

  function doDelete() {
    if (!deleteTarget) return;
    const title = events.find(e => e.id === deleteTarget)?.title || '';
    setEvents(es => es.filter(e => e.id !== deleteTarget));
    apiDeleteEvent(deleteTarget).catch(() => {});
    try {
      const created = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
      localStorage.setItem('erms_created_events', JSON.stringify(created.filter(e => e.id !== deleteTarget)));
    } catch {}
    setDeleteTarget(null);
    setView('home');
    showToast('🗑 Event deleted');
  }

  // ── Attendees ────────────────────────────────────────────────────────────
  const filteredAttendees = useMemo(() => {
    const q = attSearch.toLowerCase();
    return attendees.filter(a =>
      (attFilter === 'all' || a.status === attFilter) &&
      (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    );
  }, [attendees, attSearch, attFilter]);

  function toggleCheckin(id) {
    setAttendees(as => as.map(a => {
      if (a.id !== id) return a;
      if (a.status === 'cancelled') { showToast("Cancelled registrations can't be checked in"); return a; }
      return { ...a, status: a.status === 'checked-in' ? 'pending' : 'checked-in' };
    }));
  }

  function resendEmail(a) {
    showToast(`📧 Confirmation resent to ${a.email}`);
  }

  function exportCSV() {
    if (!filteredAttendees.length) { showToast('Nothing to export'); return; }
    const cell = v => { v = String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
    const csv = [
      ['Name', 'Email', 'Ticket', 'Purchase Date', 'Status'].join(','),
      ...filteredAttendees.map(a => [a.name, a.email, a.ticket, a.date, a.status].map(cell).join(',')),
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'attendees.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast(`⬇ CSV exported (${filteredAttendees.length} rows)`);
  }

  const viewMeta = VIEW_META[view] || VIEW_META.home;

  return (
    <>
      {/* ── Navbar ── */}
      <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
        <Link className="nav-logo" to="/">
          <span className="logo-top">Planning</span>
          <span className="logo-bottom">Center</span>
        </Link>
        <button className={`hamburger${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(v => !v)}>
          <span /><span /><span />
        </button>
        <div className={`nav-links${navOpen ? ' open' : ''}`}>
          <button className="btn btn-outline" onClick={() => { navigate('/'); setNavOpen(false); }}>
            <i className="ri-home-line" /> Home
          </button>
          <button className="btn btn-primary"><i className="ri-dashboard-line" /> Dashboard</button>
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/login'); }}>
            <i className="ri-logout-box-r-line" /> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>{viewMeta.title}</h1>
            <p>{viewMeta.sub}</p>
          </div>
          {view === 'home' && (
            <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
              <i className="ri-add-line" /> Create New Event
            </button>
          )}
        </div>

        <div className="dashboard-body">

          {/* ══ HOME VIEW ══ */}
          {view === 'home' && (
            <>
              <div className="stats-cards">
                {stats.map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-card-info">
                      <div className="label">{s.label}</div>
                      <div className="value">{s.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.sub}</div>
                    </div>
                    <div className="stat-card-icon"><i className={s.icon} /></div>
                  </div>
                ))}
              </div>

              <div className="section-title">My Events</div>

              {events.length === 0 ? (
                <div className="empty-state"><p>No events yet. Create your first event!</p></div>
              ) : (
                events.map(ev => {
                  const pct = Math.min(100, Math.round((ev.registered / ev.capacity) * 100));
                  return (
                    <div className="org-event-card" key={ev.id}>
                      <div className="org-event-img">
                        <img src={ev.image} alt={ev.title} onError={e => { e.currentTarget.src = '/images/Sport%20event.jpg'; }} />
                        <div className="org-price-tag">${ev.price}</div>
                      </div>
                      <div className="org-event-info">
                        <div style={{ marginBottom: 6 }}>
                          <span className={`badge ${ev.status === 'published' ? 'badge-confirmed' : 'badge-pending'}`}>
                            {ev.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <h3>{ev.title}</h3>
                        <div className="org-event-date"><i className="ri-calendar-line" /> {ev.date}</div>
                        <div className="org-progress-label">
                          <span>Registrations: {ev.registered.toLocaleString()} / {ev.capacity.toLocaleString()}</span>
                          <span>{pct}% filled</span>
                        </div>
                        <div className="org-progress-bar">
                          <div className="org-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="org-event-stats">
                          <div className="org-stat-item"><div className="s-label">Revenue</div><div className="s-value">{money(ev.registered * ev.price)}</div></div>
                          <div className="org-stat-item"><div className="s-label">Attendees</div><div className="s-value">{ev.registered.toLocaleString()}</div></div>
                          <div className="org-stat-item"><div className="s-label">Available</div><div className="s-value">{(ev.capacity - ev.registered).toLocaleString()}</div></div>
                        </div>
                        <div className="org-event-actions">
                          <button className="btn btn-view-event btn-sm" onClick={() => showView('event', ev.id)}>
                            <i className="ri-eye-line" /> View Event
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            localStorage.setItem('erms_edit_event', JSON.stringify(ev));
                            navigate('/create-event');
                          }}>
                            <i className="ri-edit-line" /> Edit
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => duplicateEvent(ev.id)}>
                            <i className="ri-file-copy-line" /> Duplicate
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setCurrentEventId(ev.id); setAttSearch(''); setAttFilter('all'); setView('attendees'); }}>
                            <i className="ri-group-line" /> View Attendees
                          </button>
                          <button className="btn btn-delete btn-sm" onClick={() => setDeleteTarget(ev.id)}>
                            <i className="ri-delete-bin-line" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ══ EVENT VIEW ══ */}
          {view === 'event' && currentEvent && (
            <>
              <button className="view-back" onClick={() => setView('home')}>
                <i className="ri-arrow-left-line" /> Back to dashboard
              </button>
              <div className="org-toolbar">
                <strong style={{ fontSize: 15 }}>{currentEvent.title}</strong>
                <span className="spacer" />
                <button className="btn btn-outline btn-sm" onClick={() => {
                  localStorage.setItem('erms_edit_event', JSON.stringify(currentEvent));
                  navigate('/create-event');
                }}>
                  <i className="ri-edit-line" /> Edit
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => togglePublish(currentEvent.id)}>
                  {currentEvent.status === 'published'
                    ? <><i className="ri-eye-off-line" /> Unpublish</>
                    : <><i className="ri-send-plane-line" /> Publish</>}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => showToast('Analytics coming soon')}>
                  <i className="ri-line-chart-line" /> Analytics
                </button>
              </div>

              {/* Event detail */}
              <div className="detail-section" style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
                <img className="ev-summary-img" src={currentEvent.image} alt={currentEvent.title}
                  onError={e => { e.currentTarget.src = '/images/Sport%20event.jpg'; }} />
                <div style={{ marginBottom: 8 }}>
                  <span className={`badge ${currentEvent.status === 'published' ? 'badge-confirmed' : 'badge-pending'}`}>
                    {currentEvent.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{currentEvent.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-medium)', lineHeight: 1.7, marginBottom: 14 }}>{currentEvent.description}</p>
                <div className="org-event-stats">
                  {[
                    { label: 'Date', value: currentEvent.date },
                    { label: 'Location', value: currentEvent.location },
                    { label: 'Price', value: `$${currentEvent.price}` },
                    { label: 'Filled', value: `${Math.min(100, Math.round((currentEvent.registered / currentEvent.capacity) * 100))}%` },
                  ].map(s => (
                    <div className="org-stat-item" key={s.label}>
                      <div className="s-label">{s.label}</div>
                      <div className="s-value" style={{ fontSize: 13 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 attendees */}
              <div className="detail-section" style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-lg)', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>Recent Attendees</strong>
                  <button className="view-back" style={{ margin: 0 }} onClick={() => { setCurrentEventId(currentEvent.id); setAttSearch(''); setAttFilter('all'); setView('attendees'); }}>
                    View all <i className="ri-arrow-right-line" />
                  </button>
                </div>
                {attendees.slice(0, 5).map(a => (
                  <div className="top5-row" key={a.id}>
                    <div className="avatar-circle">{initials(a.name)}</div>
                    <div className="grow">
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                      <div className="em">{a.email}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ ATTENDEES VIEW ══ */}
          {view === 'attendees' && (
            <>
              <button className="view-back" onClick={() => setView('home')}>
                <i className="ri-arrow-left-line" /> Back to dashboard
              </button>
              <div className="section-title">
                Attendees{currentEvent ? ` — ${currentEvent.title}` : ''}
              </div>

              <div className="att-toolbar">
                <input
                  className="att-search"
                  placeholder="Search name or email…"
                  value={attSearch}
                  onChange={e => setAttSearch(e.target.value)}
                />
                <select className="att-filter" value={attFilter} onChange={e => setAttFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="checked-in">Checked-in</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={exportCSV}>
                  <i className="ri-download-2-line" /> Export CSV
                </button>
              </div>

              {filteredAttendees.length === 0 ? (
                <div className="empty-state"><p>No attendees match your filters.</p></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Attendee</th><th>Email</th><th>Ticket</th>
                        <th>Purchase Date</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendees.map(a => (
                        <tr key={a.id}>
                          <td>
                            <div className="att-name-cell">
                              <div className="avatar-circle">{initials(a.name)}</div>
                              {a.name}
                            </div>
                          </td>
                          <td>{a.email}</td>
                          <td>{a.ticket}</td>
                          <td>{a.date}</td>
                          <td><StatusBadge status={a.status} /></td>
                          <td>
                            <div className="action-btns">
                              <button className="row-act" title="Resend confirmation email" onClick={() => resendEmail(a)}>
                                <i className="ri-mail-send-line" />
                              </button>
                              <button
                                className={`row-act${a.status === 'checked-in' ? ' on' : ''}`}
                                title="Toggle check-in"
                                onClick={() => toggleCheckin(a.id)}
                              >
                                <i className="ri-checkbox-circle-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Delete Modal */}
      <div className={`modal-overlay${deleteTarget ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
        <div className="modal-sm">
          <div className="modal-warn"><i className="ri-error-warning-line" /></div>
          <h3>Delete event?</h3>
          <p>
            Are you sure you want to delete{' '}
            <strong>{events.find(e => e.id === deleteTarget)?.title}</strong>?
            {' '}This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doDelete}>Yes, Delete</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`org-toast${toast.show ? ' show' : ''}`} role="status" aria-live="polite">
        {toast.msg}
      </div>
    </>
  );
}

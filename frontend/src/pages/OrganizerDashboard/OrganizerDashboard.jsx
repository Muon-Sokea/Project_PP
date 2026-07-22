import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiTogglePublish, apiDeleteEvent } from '../../services/event.service.js';
import { apiGetOrganizerStats } from '../../services/organizer.service.js';
import { apiGetEventAttendees } from '../../services/registration.service.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import { useToast } from '../../hooks/useToast.js';
import { initials } from '../../utils/initials.js';
import { money } from '../../utils/money.js';
import { fmtDate } from '../../utils/formatDate.js';
import DashboardNavbar from '../../components/layout/DashboardNavbar/DashboardNavbar.jsx';
import '../../../assets/css/1_global.css';
import '../../../assets/css/6_dashboard.css';
import './OrganizerDashboard.css';

const LIMIT = 20;

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

  // ── State ──────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState('home');
  const [currentEventId, setCurrentEventId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, showToast] = useToast();
  const [attSearch, setAttSearch] = useState('');
  const [attFilter, setAttFilter] = useState('all');
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────
  async function loadDashboard(pageNum = 1) {
    setPage(pageNum);
    try {
      const statsData = await apiGetOrganizerStats(pageNum, LIMIT);

      if (statsData) {
        setStats({
          totalEvents: statsData.totalEvents || 0,
          totalRegistrations: statsData.totalRegistrations || 0,
          totalRevenue: statsData.totalRevenue || 0,
          averageAttendee: statsData.averageAttendee || 0,
        });

        if (statsData.recentRegistrations?.length) {
          setAttendees(statsData.recentRegistrations.map((r, idx) => ({
            id: idx,
            name: r.name,
            email: r.email || '',
            ticket: 'Standard',
            date: r.date,
            status: r.status === 'confirmed' ? 'checked-in' : 'pending',
          })));
        }

        if (statsData.events?.length) {
          setEvents(statsData.events);
        }

        setTotalPages(statsData.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      try {
        const created = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
        if (created.length) setEvents(created);
      } catch {}
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setLoading(true);
      await loadDashboard(1);
      if (!cancelled) setLoading(false);
    }
    loadInitial();
    return () => { cancelled = true; };
  }, []);

  // Load more events (next page)
  async function loadMoreEvents() {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    try {
      const statsData = await apiGetOrganizerStats(nextPage, LIMIT);
      if (statsData?.events?.length) {
        setEvents(prev => [...prev, ...statsData.events]);
        setTotalPages(statsData.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load more events:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  // Merge any locally-created events (drafts saved offline)
  useEffect(() => {
    try {
      const created = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
      if (created.length) {
        const createdIds = new Set(created.map(e => String(e.id)));
        setEvents(prev => {
          const existing = prev.filter(e => !createdIds.has(String(e.id)));
          return [...existing, ...created];
        });
      }
    } catch {}
  }, []);

  // ── Fetch event-specific attendees when switching to attendees view ──────
  useEffect(() => {
    if (view !== 'attendees' || !currentEventId) return;
    let cancelled = false;
    async function fetchAttendees() {
      setLoadingAttendees(true);
      if (!cancelled) setAttendees([]); // Clear stale data immediately
      try {
        const data = await apiGetEventAttendees(currentEventId);
        if (cancelled) return;
        const mappedAttendees = (data.attendees || []).map((r, idx) => ({
          id: r.id || idx,
          name: r.name,
          email: r.email || '',
          ticket: r.ticket || 'Standard',
          ticketCode: r.ticketCode || '',
          quantity: r.quantity || 1,
          price: r.price || 0,
          date: r.date,
          status: r.status === 'confirmed' ? 'checked-in' : r.status === 'cancelled' ? 'cancelled' : 'pending',
        }));
        setAttendees(mappedAttendees);
        // Sync the registered count from the API response back to events for real-time accuracy
        if (typeof data.total === 'number') {
          setEvents(prev => prev.map(ev =>
            ev.id === currentEventId ? { ...ev, registered: data.total } : ev
          ));
        }
      } catch (err) {
        console.error('Failed to load event attendees:', err);
        if (!cancelled) {
          setAttendees([]);
          showToast(`Failed to load attendees: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoadingAttendees(false);
      }
    }
    fetchAttendees();
    return () => { cancelled = true; };
  }, [view, currentEventId]);

  useBodyScrollLock(!!deleteTarget);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  function showView(name, id) {
    if (id !== undefined) setCurrentEventId(id);
    setView(name);
  }



  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId), [events, currentEventId]);

  // ── Home stats ──────────────────────────────────────────────────────────
  const statCards = useMemo(() => {
    if (stats) {
      const totalReg = stats.totalRegistrations;
      const totalRev = stats.totalRevenue;
      const avg      = stats.averageAttendee;
      const published = events.filter(e => e.status === 'published').length;
      return [
        { label: 'Total Events',        value: stats.totalEvents,        sub: `${published} published`,  icon: 'ri-file-list-3-line' },
        { label: 'Total Registrations', value: totalReg.toLocaleString(), sub: 'Across all events',     icon: 'ri-group-line' },
        { label: 'Total Revenue',       value: money(totalRev),          sub: 'Gross to date',         icon: 'ri-money-dollar-circle-line' },
        { label: 'Average Attendance',  value: avg.toLocaleString(),     sub: 'Per event',             icon: 'ri-bar-chart-line' },
      ];
    }
    const totalReg = events.reduce((s, e) => s + (Number(e.registered) || 0), 0);
    const totalRev = events.reduce((s, e) => s + (Number(e.registered) || 0) * (Number(e.price) || 0), 0);
    const avg      = events.length ? Math.round(totalReg / events.length) : 0;
    const published = events.filter(e => e.status === 'published').length;
    return [
      { label: 'Total Events',        value: events.length,        sub: `${published} published`, icon: 'ri-file-list-3-line' },
      { label: 'Total Registrations', value: totalReg.toLocaleString(), sub: 'Across all events', icon: 'ri-group-line' },
      { label: 'Total Revenue',       value: money(totalRev),      sub: 'Gross to date',         icon: 'ri-money-dollar-circle-line' },
      { label: 'Average Attendance',  value: avg.toLocaleString(), sub: 'Per event',             icon: 'ri-bar-chart-line' },
    ];
  }, [events, stats]);

  // ── Event actions ───────────────────────────────────────────────────────
  async function togglePublish(id) {
    const ev = events.find(e => e.id === id);
    const prevStatus = ev?.status || 'draft';
    const nextStatus = prevStatus === 'published' ? 'draft' : 'published';
    // Optimistic update
    setEvents(es => es.map(e => e.id === id ? { ...e, status: nextStatus } : e));
    try {
      const updated = await apiTogglePublish(id);
      // Real-time update with server response
      if (updated && updated.published !== undefined) {
        setEvents(es => es.map(e =>
          e.id === id
            ? { ...e, status: updated.published ? 'published' : 'draft' }
            : e
        ));
      }
      showToast(nextStatus === 'published' ? 'Event published' : 'Event unpublished');
      // Notify public page to update in real-time
      window.dispatchEvent(new CustomEvent('erms:events-updated'));
    } catch (err) {
      // Revert on failure
      setEvents(es => es.map(e => e.id === id ? { ...e, status: prevStatus } : e));
      showToast(`Failed to update status: ${err.message}`);
    }
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

  async function doDelete() {
    if (!deleteTarget) return;
    const deletedEvent = events.find(e => e.id === deleteTarget);
    if (!deletedEvent) return;

    // Optimistic removal from UI
    setEvents(es => es.filter(e => e.id !== deleteTarget));
    setDeleteTarget(null);
    setView('home');

    // Remove from localStorage and check if this was a local-only event (no API call needed)
    let isLocalOnly = false;
    try {
      const created = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
      isLocalOnly = created.some(e => String(e.id) === String(deleteTarget));
      localStorage.setItem('erms_created_events', JSON.stringify(created.filter(e => String(e.id) !== String(deleteTarget))));
    } catch {}

    if (isLocalOnly) {
      // Local-only event (duplicate or offline draft) — no API needed
      showToast('Event has been deleted!');
      return;
    }

    // Server event — call API to delete from database, then re-fetch fresh data
    try {
      await apiDeleteEvent(deleteTarget);
      await loadDashboard(1);
      showToast('Event has been deleted!');
      window.dispatchEvent(new CustomEvent('erms:events-updated'));
    } catch (err) {
      // Revert on failure
      setEvents(es => [...es, deletedEvent]);
      showToast(`Failed to delete event: ${err.message}`);
    }
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
    const cell = v => { v = String(v); return /[\",\\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
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
      <DashboardNavbar />

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
              {loading ? (
                <div className="stats-cards">
                  {[1, 2, 3, 4].map(i => (
                    <div className="stat-card" key={i}>
                      <div className="stat-card-info">
                        <div className="label" style={{ background: 'var(--border)', height: 14, width: '60%', borderRadius: 4, marginBottom: 8 }} />
                        <div className="value" style={{ background: 'var(--border)', height: 28, width: '40%', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stats-cards">
                  {statCards.map(s => (
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
              )}

              <div className="section-title">My Events</div>

              {!loading && events.length === 0 ? (
                <div className="empty-state"><p>No events yet. Create your first event!</p></div>
              ) : (
                <>
                  {events.map(ev => {
                    const reg = Number(ev.registered) || 0;
                    const cap = Number(ev.capacity) || 1;
                    const pct = Math.min(100, Math.round((reg / cap) * 100));
                    return (
                      <div className="org-event-card" key={ev.id}>
                        <div className="org-event-img">
                          <img src={ev.image} alt={ev.title} loading="lazy" decoding="async" onError={e => { e.currentTarget.src = '/images/Sport%20event.jpg'; }} />
                          <div className="org-price-tag">${ev.price}</div>
                        </div>
                        <div className="org-event-info">
                          <div style={{ marginBottom: 6 }}>
                            <span className={`badge ${ev.status === 'published' ? 'badge-confirmed' : 'badge-pending'}`}>
                              {ev.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <h3>{ev.title}</h3>
                          <div className="org-event-date"><i className="ri-calendar-line" /> {fmtDate(ev.date, 'long')}</div>
                          {ev.time && <div className="org-event-date"><i className="ri-time-line" /> {ev.time}</div>}
                          <div className="org-progress-label">
                            <span>Registrations: {reg.toLocaleString()} / {cap.toLocaleString()}</span>
                            <span>{pct}% filled</span>
                          </div>
                          <div className="org-progress-bar">
                            <div className="org-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="org-event-stats">
                            <div className="org-stat-item"><div className="s-label">Revenue</div><div className="s-value">{money(reg * (Number(ev.price) || 0))}</div></div>
                            <div className="org-stat-item"><div className="s-label">Attendees</div><div className="s-value">{reg.toLocaleString()}</div></div>
                            <div className="org-stat-item"><div className="s-label">Available</div><div className="s-value">{Math.max(0, cap - reg).toLocaleString()}</div></div>
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
                  })}

                  {/* Load More */}
                  {page < totalPages && (
                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                      <button
                        className="btn btn-outline"
                        onClick={loadMoreEvents}
                        disabled={loadingMore}
                        style={{ minWidth: 180 }}
                      >
                        {loadingMore ? (
                          <><i className="ri-loader-4-line ri-spin" /> Loading…</>
                        ) : (
                          <><i className="ri-arrow-down-line" /> Load More ({Math.min(LIMIT, stats?.totalEvents - events.length || 0)} remaining)</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Page info */}
                  {page > 0 && totalPages > 1 && (
                    <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>
                      Showing {events.length} of {stats?.totalEvents || 0} events
                    </div>
                  )}
                </>
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

              </div>

              {/* Event detail */}
              <div className="detail-section" style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
                <img className="ev-summary-img" src={currentEvent.image} alt={currentEvent.title}
                  loading="lazy" decoding="async" onError={e => { e.currentTarget.src = '/images/Sport%20event.jpg'; }} />
                <div style={{ marginBottom: 8 }}>
                  <span className={`badge ${currentEvent.status === 'published' ? 'badge-confirmed' : 'badge-pending'}`}>
                    {currentEvent.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{currentEvent.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-medium)', lineHeight: 1.7, marginBottom: 14 }}>{currentEvent.description}</p>
                <div className="org-event-stats">
                  {[
                    { label: 'Date', value: fmtDate(currentEvent.date, 'long') },
                    { label: 'Location', value: currentEvent.location },
                    { label: 'Price', value: `$${Number(currentEvent.price) || 0}` },
                    { label: 'Filled', value: `${Math.min(100, Math.round(((Number(currentEvent.registered) || 0) / (Number(currentEvent.capacity) || 1)) * 100))}%` },
                  ].map(s => (
                    <div className="org-stat-item" key={s.label}>
                      <div className="s-label">{s.label}</div>
                      <div className="s-value" style={{ fontSize: 13 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Registrations */}
              <div className="detail-section" style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-lg)', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>Recent Registrations</strong>
                </div>
                {attendees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: 13 }}>
                    No registrations yet. Share your event to get attendees.
                  </div>
                ) : (
                  attendees.slice(0, 5).map(a => (
                    <div className="top5-row" key={a.id}>
                      <div className="avatar-circle">{initials(a.name)}</div>
                      <div className="grow">
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                        <div className="em">{a.email}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))
                )}
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
                {loadingAttendees ? (
                  <span style={{ fontSize: 13, color: 'var(--text-light)', marginLeft: 8 }}><i className="ri-loader-4-line ri-spin" /></span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 400, marginLeft: 8 }}>
                    ({currentEvent ? Number(currentEvent.registered) || 0 : attendees.length})
                  </span>
                )}
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

              {loadingAttendees ? (
                <div className="empty-state">
                  <div className="ri-loader-4-line ri-spin" style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 12 }} />
                  <p>Loading attendees…</p>
                </div>
              ) : filteredAttendees.length === 0 ? (
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
              <td>{fmtDate(a.date)}</td>
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

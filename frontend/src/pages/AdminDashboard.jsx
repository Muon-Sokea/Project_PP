import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  apiGetAllUsers, apiCreateUser, apiUpdateUser, apiDeleteUser,
  apiDeleteEvent, apiTogglePublish, apiUpdateRefundStatus,
} from '../services/api.js';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import '../../assets/css/6_dashboard.css';
import './AdminDashboard.css';

const RESERVED_USERS = [
  { firstName: 'Muon',    lastName: 'Sokea',      email: 'muonsokea@gmail.com',     role: 'Supervisor', joined: 'Jan 10, 2026' },
  { firstName: 'San',     lastName: 'Sotheayuth', email: 'sansotheayuth@gmail.com', role: 'Admin',      joined: 'Jan 10, 2026' },
  { firstName: 'Proeung', lastName: 'Sivly',      email: 'proeungsivly@gmail.com',  role: 'Organizer',  joined: 'Jan 10, 2026' },
  { firstName: 'Lang',    lastName: 'Socheat',    email: 'langsocheat@gmail.com',   role: 'Attendee',   joined: 'Jan 10, 2026' },
];

const ROLE_BADGE = { Supervisor: 'badge-role-supervisor', Admin: 'badge-role-admin', Organizer: 'badge-role-organizer', Attendee: 'badge-role-attendee' };
const ROLE_LABEL = { Supervisor: 'Super Admin', Admin: 'Admin', Organizer: 'Organizer', Attendee: 'Attendee' };
const AVATAR_BG  = { Supervisor: ['#fef9c3','#a16207'], Admin: ['#dbeafe','#1d4ed8'], Organizer: ['#fce7f3','#be185d'], Attendee: ['#dcfce7','#15803d'] };
const REFUND_BADGE = { pending: 'badge-pending', approved: 'badge-confirmed', rejected: 'badge-cancelled' };
const REFUND_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const STATUS_BADGE  = { Available: 'badge-available', Full: 'badge-full', Draft: 'badge-pending' };
const RECENT_REGS = [
  { initial: 'M', role: 'Admin',      name: 'Muon Sokea',      event: 'Tech Innovation Summit 2026',   date: 'March 13, 2026', amount: '$300', status: 'confirmed' },
  { initial: 'P', role: 'Organizer',  name: 'Proeung Sivly',   event: 'Business Leadership Conference', date: 'March 13, 2026', amount: '$300', status: 'pending' },
  { initial: 'S', role: 'Attendee',   name: 'San Sotheayuth',  event: 'Digital Marketing Workshop',    date: 'March 13, 2026', amount: '$300', status: 'confirmed' },
  { initial: 'L', role: 'Supervisor', name: 'Lang Socheat',    event: 'Networking & Innovation Forum', date: 'March 13, 2026', amount: '$300', status: 'cancelled' },
];

const fullName = u => `${u.firstName} ${u.lastName}`.trim() || u.email;
const initial  = u => (u.firstName || u.email || '?').charAt(0).toUpperCase();

function loadLS(key, fallback = []) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(v) ? v : (v || fallback); } catch { return fallback; }
}
function saveLS(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function ChartCanvas({ id }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    let chart;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (id === 'revenueChart') {
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Oct','Nov','Dec','Jan','Feb','Mar'],
            datasets: [{ data: [45000,52000,48000,60000,55000,72000], borderColor:'#4A90D9',
              backgroundColor:'rgba(74,144,217,0.08)', tension:0.4, fill:true,
              pointBackgroundColor:'#4A90D9', pointRadius:4 }],
          },
          options: { plugins:{ legend:{ display:false } },
            scales:{ y:{ beginAtZero:true, grid:{ color:'#f0f0f0' } }, x:{ grid:{ display:false } } } },
        });
      } else {
        chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Technology','Business','Workshop','Entertainment','Healthcare'],
            datasets: [{ data: [45,31,28,32,15], backgroundColor:'#4A90D9', borderRadius:4 }],
          },
          options: { plugins:{ legend:{ display:false } },
            scales:{ y:{ beginAtZero:true, grid:{ color:'#f0f0f0' } }, x:{ grid:{ display:false } } } },
        });
      }
    }).catch(() => {});
    return () => chart?.destroy();
  }, [id]);
  return <canvas ref={canvasRef} id={id} height={180} />;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [navOpen, setNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  // Users state
  const [roleFilter, setRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');

  // Events state
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');

  // Refunds state
  const [refundFilter, setRefundFilter] = useState('all');
  const [refunds, setRefunds] = useState(() => loadLS('erms_refunds', []));

  // Modal state
  const [modal, setModal] = useState(null); // 'view'|'edit'|'delete'|'eventDelete'|'createUser'
  const [viewUser, setViewUser] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editRole, setEditRole] = useState('Attendee');
  const [editStatus, setEditStatus] = useState('Active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [eventDeleteTarget, setEventDeleteTarget] = useState(null);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Attendee' });
  const [createErr, setCreateErr] = useState('');

  // Refresh key to re-read localStorage after mutations
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setModal(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Data helpers ────────────────────────────────────────────────────────
  const getUsers = useCallback(() => {
    const ov = loadLS('erms_admin_overrides', {});
    const reserved = RESERVED_USERS
      .map(u => {
        const o = (typeof ov === 'object' && !Array.isArray(ov)) ? (ov[u.email] || {}) : {};
        return { ...u, role: o.role || u.role, status: o.status || 'Active', deleted: !!o.deleted, src: 'reserved' };
      })
      .filter(u => !u.deleted);
    const attendees = loadLS('erms_attendees', []).map(u => ({
      firstName: u.firstName || '', lastName: u.lastName || '',
      email: u.email || '', role: u.role || 'Attendee',
      status: u.status || 'Active',
      joined: u.joined || (Number(u.id) > 1e12
        ? new Date(Number(u.id)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'),
      phone: u.phone || '', address: u.address || '', src: 'attendee',
    }));
    return [...reserved, ...attendees];
  }, [tick]);

  const users = useMemo(() => getUsers(), [getUsers]);

  const getEvents = useCallback(() => {
    const ov = loadLS('erms_event_overrides', {});
    const created = loadLS('erms_created_events', []).map(e => ({
      ...e, reg: Number(e.registered ?? e.attending) || 0,
      rawStatus: e.status || 'published', src: 'created',
    }));
    const createdIds = new Set(created.map(e => String(e.id)));
    const mockRaw = loadLS('erms_events', []);
    const mock = mockRaw.map(e => {
      const o = (typeof ov === 'object' && !Array.isArray(ov)) ? (ov[e.id] || {}) : {};
      return { ...e, reg: Number(e.attending ?? e.registered) || 0,
        rawStatus: o.status || 'published', deleted: !!o.deleted, src: 'mock' };
    }).filter(e => !e.deleted && !createdIds.has(String(e.id)));
    return [...mock, ...created];
  }, [tick]);

  const events = useMemo(() => getEvents(), [getEvents]);

  function displayStatus(e) {
    if (e.rawStatus === 'draft') return 'Draft';
    const cap = Number(e.capacity) || 0;
    return (cap > 0 && e.reg >= cap) ? 'Full' : 'Available';
  }

  // ── Filtered users ───────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter(u => {
      const roleOk = roleFilter === 'all' || u.role === roleFilter;
      return roleOk && (fullName(u) + ' ' + u.email).toLowerCase().includes(q);
    });
  }, [users, roleFilter, userSearch]);

  // ── Filtered events ──────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const q = eventSearch.toLowerCase();
    return events.filter(e => {
      const st = displayStatus(e);
      const stOk = statusFilter === 'all' || st === statusFilter;
      return stOk && (`${e.title} ${e.category || ''}`).toLowerCase().includes(q);
    });
  }, [events, statusFilter, eventSearch]);

  // ── Filtered refunds ─────────────────────────────────────────────────────
  const filteredRefunds = useMemo(() =>
    refundFilter === 'all' ? refunds : refunds.filter(r => r.status === refundFilter),
  [refunds, refundFilter]);

  const pendingRefundCount = useMemo(() => refunds.filter(r => r.status === 'pending').length, [refunds]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalReg = events.reduce((s, e) => s + e.reg, 0);
    const totalRev = events.reduce((s, e) => s + e.reg * (Number(e.price) || 0), 0);
    return [
      { label: 'Total Events',   value: events.length.toLocaleString(),       sub: 'Live platform count', icon: 'ri-file-list-3-line' },
      { label: 'Total Users',    value: users.length.toLocaleString(),         sub: 'Live platform count', icon: 'ri-group-line' },
      { label: 'Total Revenue',  value: '$' + totalRev.toLocaleString(),       sub: 'From registrations × price', icon: 'ri-money-dollar-circle-line' },
      { label: 'Registrations',  value: totalReg.toLocaleString(),             sub: 'Across all events', icon: 'ri-bar-chart-line' },
    ];
  }, [events, users]);

  // ── Recent regs filter ───────────────────────────────────────────────────
  const filteredRecentRegs = useMemo(() =>
    RECENT_REGS.filter(r => (r.name + ' ' + r.event).toLowerCase().includes(regSearch.toLowerCase())),
  [regSearch]);

  // ── User actions ─────────────────────────────────────────────────────────
  function openEdit(email) {
    const u = users.find(u => u.email === email);
    if (!u) return;
    setEditTarget(email);
    setEditRole(u.role === 'Supervisor' ? 'Admin' : u.role);
    setEditStatus(u.status);
    setModal('edit');
  }

  function saveEdit() {
    const u = users.find(u => u.email === editTarget);
    if (!u) { setModal(null); return; }
    if (u.src === 'attendee') {
      const list = loadLS('erms_attendees', []);
      const i = list.findIndex(a => (a.email || '').toLowerCase() === editTarget.toLowerCase());
      if (i !== -1) { list[i].role = editRole; list[i].status = editStatus; saveLS('erms_attendees', list);
        apiUpdateUser(list[i].id, { role: editRole, status: editStatus }).catch(() => {}); }
    } else {
      const ov = loadLS('erms_admin_overrides', {});
      ov[u.email] = { ...(ov[u.email] || {}), role: editRole, status: editStatus };
      saveLS('erms_admin_overrides', ov);
    }
    setModal(null);
    refresh();
  }

  function toggleSuspend(email) {
    const u = users.find(u => u.email === email);
    if (!u) return;
    const next = u.status === 'Suspended' ? 'Active' : 'Suspended';
    if (u.src === 'attendee') {
      const list = loadLS('erms_attendees', []);
      const i = list.findIndex(a => (a.email || '').toLowerCase() === email.toLowerCase());
      if (i !== -1) { list[i].status = next; saveLS('erms_attendees', list); }
    } else {
      const ov = loadLS('erms_admin_overrides', {});
      ov[u.email] = { ...(ov[u.email] || {}), status: next };
      saveLS('erms_admin_overrides', ov);
    }
    refresh();
  }

  function doDeleteUser() {
    const u = users.find(u => u.email === deleteTarget);
    if (!u) { setModal(null); return; }
    if (u.src === 'attendee') {
      const remaining = loadLS('erms_attendees', []).filter(a => (a.email || '').toLowerCase() !== deleteTarget.toLowerCase());
      saveLS('erms_attendees', remaining);
      if (u.id) apiDeleteUser(u.id).catch(() => {});
    } else {
      const ov = loadLS('erms_admin_overrides', {});
      ov[u.email] = { ...(ov[u.email] || {}), deleted: true };
      saveLS('erms_admin_overrides', ov);
    }
    setModal(null);
    refresh();
  }

  function createUser() {
    setCreateErr('');
    const { firstName, lastName, email, password, role } = createForm;
    if (!firstName || !lastName || !email || !password) { setCreateErr('Please fill in all required fields.'); return; }
    if (password.length < 6) { setCreateErr('Password must be at least 6 characters.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setCreateErr('Please enter a valid email address.'); return; }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) { setCreateErr('An account with this email already exists.'); return; }
    const newUser = { id: Date.now(), firstName, lastName, email: email.toLowerCase(), role,
      status: 'Active', joined: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }), phone: '', address: '' };
    saveLS('erms_attendees', [...loadLS('erms_attendees', []), newUser]);
    apiCreateUser({ firstName, lastName, email: email.toLowerCase(), password, role }).catch(() => {});
    setCreateForm({ firstName: '', lastName: '', email: '', password: '', role: 'Attendee' });
    setModal(null);
    refresh();
  }

  // ── Event actions ─────────────────────────────────────────────────────────
  function setEventStatus(src, id, status) {
    if (src === 'created') {
      const list = loadLS('erms_created_events', []);
      const i = list.findIndex(e => String(e.id) === String(id));
      if (i !== -1) { list[i].status = status; saveLS('erms_created_events', list); }
    } else {
      const ov = loadLS('erms_event_overrides', {});
      ov[id] = { ...(ov[id] || {}), status };
      saveLS('erms_event_overrides', ov);
    }
    apiTogglePublish(id).catch(() => {});
    refresh();
  }

  function doDeleteEvent() {
    if (!eventDeleteTarget) { setModal(null); return; }
    const { src, id } = eventDeleteTarget;
    if (src === 'created') {
      saveLS('erms_created_events', loadLS('erms_created_events', []).filter(e => String(e.id) !== String(id)));
    } else {
      const ov = loadLS('erms_event_overrides', {});
      ov[id] = { ...(ov[id] || {}), deleted: true };
      saveLS('erms_event_overrides', ov);
    }
    apiDeleteEvent(id).catch(() => {});
    setModal(null);
    refresh();
  }

  // ── Refund actions ────────────────────────────────────────────────────────
  function updateRefund(index, status) {
    const stored = loadLS('erms_refunds', []);
    if (stored[index]) {
      stored[index].status = status;
      saveLS('erms_refunds', stored);
      setRefunds([...stored]);
      apiUpdateRefundStatus(stored[index].ticketCode || stored[index].id, status).catch(() => {});
    }
  }

  const meUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('erms_user') || 'null'); } catch { return null; }
  }, []);
  const myEmail = (meUser?.email || '').toLowerCase();

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
          <button className="btn btn-outline" onClick={() => { navigate('/'); setNavOpen(false); }}><i className="ri-home-line" /> Home</button>
          <button className="btn btn-primary"><i className="ri-dashboard-line" /> Dashboard</button>
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/login'); }}><i className="ri-logout-box-r-line" /> Logout</button>
        </div>
      </nav>

      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Monitor platform performance and manage all activities</p>
          </div>
          {meUser && (
            <span style={{ fontSize: 13, color: 'var(--text-medium)' }}>
              Welcome, {meUser.firstName} {meUser.lastName}
            </span>
          )}
        </div>

        <div className="dashboard-body">

          {/* Tabs */}
          <div className="tabs">
            {[
              { id: 'overview', label: 'Overview',      icon: 'ri-bar-chart-line' },
              { id: 'users',    label: 'Manage Users',  icon: 'ri-group-line' },
              { id: 'events',   label: 'Manage Events', icon: 'ri-calendar-event-line' },
              { id: 'refunds',  label: 'Refunds',       icon: 'ri-refund-2-line', badge: pendingRefundCount },
            ].map(t => (
              <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                <i className={t.icon} /> {t.label}
                {t.badge > 0 && (
                  <span style={{ background: '#dc2626', color: '#fff', borderRadius: 999, fontSize: 10, padding: '1px 6px', marginLeft: 4 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ════════ OVERVIEW ════════ */}
          {activeTab === 'overview' && (
            <div className="tab-content active">
              <div className="stats-cards">
                {stats.map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-card-info">
                      <div className="label">{s.label}</div>
                      <div className="value">{s.value}</div>
                      <div className="trend-up">{s.sub}</div>
                    </div>
                    <div className="stat-card-icon"><i className={s.icon} /></div>
                  </div>
                ))}
              </div>

              <div className="charts-row">
                <div className="chart-card"><h3>Monthly Revenue</h3><ChartCanvas id="revenueChart" /></div>
                <div className="chart-card"><h3>Events by Category</h3><ChartCanvas id="categoryChart" /></div>
              </div>

              <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div className="section-header-row">
                  <div className="section-title" style={{ margin: 0 }}>Recent Registrations</div>
                  <div className="adm-search" style={{ margin: 0, maxWidth: 260 }}>
                    <i className="ri-search-line" />
                    <input type="text" placeholder="Search..." value={regSearch} onChange={e => setRegSearch(e.target.value)} />
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>ATTENDEE</th><th>EVENT</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
                    <tbody>
                      {filteredRecentRegs.map((r, i) => {
                        const [bg, fg] = AVATAR_BG[r.role] || ['#e2e8f0','#475569'];
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="avatar-circle" style={{ background: bg, color: fg }}>{r.initial}</div>
                                {r.name}
                              </div>
                            </td>
                            <td>{r.event}</td>
                            <td><i className="ri-time-line" /> {r.date}</td>
                            <td>{r.amount}</td>
                            <td>
                              <span className={`badge badge-${r.status}`}>
                                <i className={r.status === 'confirmed' ? 'ri-checkbox-circle-line' : r.status === 'pending' ? 'ri-time-line' : 'ri-close-circle-line'} />
                                {' '}{r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════ USERS ════════ */}
          {activeTab === 'users' && (
            <div className="tab-content active">
              <div className="section-header-row">
                <div className="section-title" style={{ margin: 0 }}>Manage Users</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    <i className="ri-group-line" /> {users.length} users
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => { setCreateForm({ firstName:'', lastName:'', email:'', password:'', role:'Attendee' }); setCreateErr(''); setModal('createUser'); }}>
                    <i className="ri-user-add-line" /> Add User
                  </button>
                </div>
              </div>

              <div className="role-filter">
                {['all','Attendee','Organizer','Admin','Supervisor'].map(r => (
                  <button key={r} className={`role-pill${roleFilter === r ? ' active' : ''}`} onClick={() => setRoleFilter(r)}>
                    {r === 'all' ? 'All' : r === 'Supervisor' ? 'Super Admin' : r}
                  </button>
                ))}
              </div>

              <div className="adm-search">
                <i className="ri-search-line" />
                <input type="text" placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No users match this filter.</td></tr>
                    ) : filteredUsers.map(u => {
                      const [bg, fg] = AVATAR_BG[u.role] || ['#e2e8f0','#475569'];
                      const isProtected = u.role === 'Supervisor' || u.email.toLowerCase() === myEmail;
                      return (
                        <tr key={u.email} className={u.status === 'Suspended' ? 'muted-row' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar-circle" style={{ background: bg, color: fg }}>{initial(u)}</div>
                              {fullName(u)}
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td><span className={`badge ${ROLE_BADGE[u.role] || ''}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                          <td>
                            {u.status === 'Suspended'
                              ? <span className="badge badge-cancelled"><i className="ri-forbid-line" /> Suspended</span>
                              : <span className="badge badge-confirmed"><i className="ri-checkbox-circle-line" /> Active</span>}
                          </td>
                          <td>{u.joined}</td>
                          <td>
                            {isProtected ? (
                              <>
                                <button className="btn btn-outline btn-sm" onClick={() => { setViewUser(u); setModal('view'); }}>
                                  <i className="ri-eye-line" />
                                </button>
                                <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 6 }}>
                                  {u.role === 'Supervisor' ? 'Protected' : 'You'}
                                </span>
                              </>
                            ) : (
                              <div className="action-btns">
                                <button className="btn btn-outline btn-sm" title="View" onClick={() => { setViewUser(u); setModal('view'); }}><i className="ri-eye-line" /></button>
                                <button className="btn btn-outline btn-sm" title="Edit" onClick={() => openEdit(u.email)}><i className="ri-edit-line" /></button>
                                <button className="btn btn-outline btn-sm" title={u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'} onClick={() => toggleSuspend(u.email)}>
                                  <i className={u.status === 'Suspended' ? 'ri-check-line' : 'ri-forbid-line'} />
                                </button>
                                <button className="btn btn-danger btn-sm" title="Delete" onClick={() => { setDeleteTarget(u.email); setModal('delete'); }}>
                                  <i className="ri-delete-bin-line" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════ EVENTS ════════ */}
          {activeTab === 'events' && (
            <div className="tab-content active">
              <div className="section-header-row">
                <div className="section-title" style={{ margin: 0 }}>Manage Events</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  <i className="ri-calendar-event-line" /> {events.length} events
                </div>
              </div>

              <div className="role-filter">
                {['all','Available','Full','Draft'].map(s => (
                  <button key={s} className={`role-pill${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>

              <div className="adm-search">
                <i className="ri-search-line" />
                <input type="text" placeholder="Search by title or category..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Event Title</th><th>Organizer</th><th>Category</th><th>Date</th><th>Registered</th><th>Revenue</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No events match this filter.</td></tr>
                    ) : filteredEvents.map(e => {
                      const st = displayStatus(e);
                      const revenue = (e.reg * (Number(e.price) || 0)).toLocaleString();
                      const cap = Number(e.capacity) || 0;
                      const isDraft = st === 'Draft';
                      return (
                        <tr key={`${e.src}-${e.id}`} className={isDraft ? 'muted-row' : ''}>
                          <td style={{ fontWeight: 500 }}>{e.title}</td>
                          <td>Proeung Sivly</td>
                          <td>{e.category || '—'}</td>
                          <td>{e.date || '—'}</td>
                          <td>{e.reg.toLocaleString()}{cap ? ` / ${cap.toLocaleString()}` : ''}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>${revenue}</td>
                          <td><span className={`badge ${STATUS_BADGE[st] || ''}`}>{st}</span></td>
                          <td>
                            <div className="action-btns">
                              <button className="btn btn-outline btn-sm" title="View" onClick={() => {
                                localStorage.setItem('erms_selected_event', JSON.stringify({ ...e, attending: e.reg, status: st }));
                                navigate('/events/' + e.id);
                              }}><i className="ri-eye-line" /></button>
                              {isDraft
                                ? <button className="btn btn-success btn-sm" title="Approve" onClick={() => setEventStatus(e.src, e.id, 'published')}><i className="ri-check-line" /></button>
                                : <button className="btn btn-outline btn-sm" title="Unpublish" onClick={() => setEventStatus(e.src, e.id, 'draft')}><i className="ri-eye-off-line" /></button>}
                              <button className="btn btn-danger btn-sm" title="Delete" onClick={() => { setEventDeleteTarget({ src: e.src, id: e.id, title: e.title }); setModal('eventDelete'); }}>
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════ REFUNDS ════════ */}
          {activeTab === 'refunds' && (
            <div className="tab-content active">
              <div className="section-header-row">
                <div className="section-title" style={{ margin: 0 }}>Refund Requests</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  <i className="ri-refund-2-line" /> {refunds.length} requests
                </div>
              </div>

              <div className="role-filter">
                {['all','pending','approved','rejected'].map(s => (
                  <button key={s} className={`role-pill${refundFilter === s ? ' active' : ''}`} onClick={() => setRefundFilter(s)}>
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Ticket</th><th>Event</th><th>Reason</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredRefunds.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No refund requests found.</td></tr>
                    ) : filteredRefunds.map((r, idx) => {
                      const realIdx = refunds.indexOf(r);
                      const date = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{r.ticketCode || '—'}</td>
                          <td>{r.eventName || '—'}</td>
                          <td>{r.reason || '—'}</td>
                          <td>{date}</td>
                          <td><span className={`badge ${REFUND_BADGE[r.status] || ''}`}>{REFUND_LABEL[r.status] || r.status}</span></td>
                          <td>
                            {r.status === 'pending' ? (
                              <div className="action-btns">
                                <button className="btn btn-success btn-sm" onClick={() => updateRefund(realIdx, 'approved')}>
                                  <i className="ri-check-line" /> Approve
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => updateRefund(realIdx, 'rejected')}>
                                  <i className="ri-close-line" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>No action needed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══ View User Modal ══ */}
      <div className={`adm-modal-overlay${modal === 'view' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="adm-modal-box">
          <div className="adm-modal-head">
            <h3>User Profile</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          {viewUser && (() => {
            const [bg, fg] = AVATAR_BG[viewUser.role] || ['#e2e8f0','#475569'];
            return (
              <>
                <div className="profile-top">
                  <div className="avatar-circle" style={{ background: bg, color: fg, width: 54, height: 54, fontSize: 20 }}>{initial(viewUser)}</div>
                  <div>
                    <div className="p-name">{fullName(viewUser)}</div>
                    <div className="p-email">{viewUser.email}</div>
                  </div>
                </div>
                {[
                  { key: 'Role',     val: <span className={`badge ${ROLE_BADGE[viewUser.role] || ''}`}>{ROLE_LABEL[viewUser.role] || viewUser.role}</span> },
                  { key: 'Status',   val: viewUser.status },
                  { key: 'Joined',   val: viewUser.joined },
                  { key: 'Phone',    val: viewUser.phone || '—' },
                  { key: 'Address',  val: viewUser.address || '—' },
                  { key: 'Account type', val: viewUser.src === 'reserved' ? 'Built-in role account' : 'Registered attendee' },
                ].map(r => (
                  <div className="detail-row" key={r.key}>
                    <span className="d-key">{r.key}</span>
                    <span className="d-val">{r.val}</span>
                  </div>
                ))}
              </>
            );
          })()}
          <div className="adm-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      </div>

      {/* ══ Edit User Modal ══ */}
      <div className={`adm-modal-overlay${modal === 'edit' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="adm-modal-box">
          <div className="adm-modal-head">
            <div className="adm-modal-icon info"><i className="ri-edit-line" /></div>
            <h3>Edit User</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <p className="adm-modal-text" style={{ marginBottom: 4 }}>
            Editing <strong>{users.find(u => u.email === editTarget) ? fullName(users.find(u => u.email === editTarget)) : ''}</strong>
          </p>
          <label className="adm-field-label">Role</label>
          <select className="adm-field-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
            <option value="Attendee">Attendee</option>
            <option value="Organizer">Organizer</option>
            <option value="Admin">Admin</option>
          </select>
          <label className="adm-field-label">Status</label>
          <select className="adm-field-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <div className="adm-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}><i className="ri-save-line" /> Save Changes</button>
          </div>
        </div>
      </div>

      {/* ══ Delete User Modal ══ */}
      <div className={`adm-modal-overlay${modal === 'delete' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="adm-modal-box">
          <div className="adm-modal-head">
            <div className="adm-modal-icon danger"><i className="ri-delete-bin-line" /></div>
            <h3>Delete User</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <p className="adm-modal-text">
            Are you sure you want to delete{' '}
            <strong>{users.find(u => u.email === deleteTarget) ? fullName(users.find(u => u.email === deleteTarget)) : ''}</strong>?
            {' '}This removes their account and cannot be undone.
          </p>
          <div className="adm-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doDeleteUser}><i className="ri-delete-bin-line" /> Delete</button>
          </div>
        </div>
      </div>

      {/* ══ Delete Event Modal ══ */}
      <div className={`adm-modal-overlay${modal === 'eventDelete' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="adm-modal-box">
          <div className="adm-modal-head">
            <div className="adm-modal-icon danger"><i className="ri-delete-bin-line" /></div>
            <h3>Delete Event</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <p className="adm-modal-text">
            Are you sure you want to delete <strong>{eventDeleteTarget?.title}</strong>?
            {' '}This removes it from the platform and cannot be undone.
          </p>
          <div className="adm-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doDeleteEvent}><i className="ri-delete-bin-line" /> Delete</button>
          </div>
        </div>
      </div>

      {/* ══ Create User Modal ══ */}
      <div className={`adm-modal-overlay${modal === 'createUser' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="adm-modal-box">
          <div className="adm-modal-head">
            <div className="adm-modal-icon info"><i className="ri-user-add-line" /></div>
            <h3>Add New User</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <div className="adm-create-grid">
            <div>
              <label className="adm-field-label">First Name *</label>
              <input className="adm-field-input" type="text" placeholder="First name"
                value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="adm-field-label">Last Name *</label>
              <input className="adm-field-input" type="text" placeholder="Last name"
                value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <label className="adm-field-label">Email *</label>
          <input className="adm-field-input" type="email" placeholder="user@example.com"
            value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          <label className="adm-field-label">Password *</label>
          <input className="adm-field-input" type="password" placeholder="Minimum 6 characters"
            value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
          <label className="adm-field-label">Role</label>
          <select className="adm-field-select" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
            <option value="Attendee">Attendee</option>
            <option value="Organizer">Organizer</option>
            <option value="Admin">Admin</option>
          </select>
          {createErr && <div style={{ fontSize: 13, color: '#dc2626', marginTop: 8 }}>{createErr}</div>}
          <div className="adm-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={createUser}><i className="ri-user-add-line" /> Create User</button>
          </div>
        </div>
      </div>
    </>
  );
}

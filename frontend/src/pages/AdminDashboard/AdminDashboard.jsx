import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetAllUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } from '../../services/user.service.js';
import { apiGetAllEvents, apiDeleteEvent, apiTogglePublish, apiApproveEvent, apiRejectEvent } from '../../services/event.service.js';
import { apiGetRefunds, apiUpdateRefundStatus } from '../../services/refund.service.js';
import { apiGetTestimonials, apiDeleteTestimonial } from '../../services/testimonial.service.js';
import { apiGetAdminStats } from '../../services/admin.service.js';
import { useEscapeKey } from '../../hooks/useEscapeKey.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import { fmtDate } from '../../utils/formatDate.js';
import DashboardNavbar from '../../components/layout/DashboardNavbar/DashboardNavbar.jsx';
import '../../../assets/css/1_global.css';
import '../../../assets/css/6_dashboard.css';
import './AdminDashboard.css';

const ROLE_BADGE = { Supervisor: 'badge-role-supervisor', Admin: 'badge-role-admin', Organizer: 'badge-role-organizer', Attendee: 'badge-role-attendee' };
const ROLE_LABEL = { Supervisor: 'Super Admin', Admin: 'Admin', Organizer: 'Organizer', Attendee: 'Attendee' };
const AVATAR_BG  = { Supervisor: ['#fef9c3','#a16207'], Admin: ['#dbeafe','#1d4ed8'], Organizer: ['#fce7f3','#be185d'], Attendee: ['#dcfce7','#15803d'] };
const REFUND_BADGE = { pending: 'badge-pending', approved: 'badge-confirmed', rejected: 'badge-cancelled' };
const REFUND_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const STATUS_BADGE  = { Available: 'badge-available', Full: 'badge-full', Draft: 'badge-pending', Pending: 'badge-pending', Rejected: 'badge-cancelled' };

const fullName = u => `${u.firstName} ${u.lastName}`.trim() || u.email;
const initial  = u => (u.firstName || u.email || '?').charAt(0).toUpperCase();

function ChartCanvas({ id, labels, data }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    let chart;
    if (!labels || !data) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (id === 'revenueChart') {
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{ data, borderColor:'#4A90D9',
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
            labels,
            datasets: [{ data, backgroundColor:'#4A90D9', borderRadius:4 }],
          },
          options: { plugins:{ legend:{ display:false } },
            scales:{ y:{ beginAtZero:true, grid:{ color:'#f0f0f0' } }, x:{ grid:{ display:false } } } },
        });
      }
    }).catch(() => {});
    return () => chart?.destroy();
  }, [id, labels, data]);
  return <canvas ref={canvasRef} id={id} height={180} />;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  // Users state
  const [roleFilter, setRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [users, setUsers] = useState([]);

  // Events state
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [refundsLoading, setRefundsLoading] = useState(true);

  // Refunds state
  const [refundFilter, setRefundFilter] = useState('all');
  const [refunds, setRefunds] = useState([]);

  // Testimonials state
  const [testimonialFilter, setTestimonialFilter] = useState('all');
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialSearch, setTestimonialSearch] = useState('');

  // Overview stats (from the real backend)
  const [overviewStats, setOverviewStats] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // 'view'|'edit'|'delete'|'eventDelete'|'createUser'
  const [viewUser, setViewUser] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editRole, setEditRole] = useState('Attendee');
  const [editStatus, setEditStatus] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [eventDeleteTarget, setEventDeleteTarget] = useState(null);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Attendee' });
  const [createErr, setCreateErr] = useState('');
  const [actionErr, setActionErr] = useState('');

  useBodyScrollLock(!!modal);
  useEscapeKey(() => setModal(null));

  // ── Data fetchers (all real API, no local mock/cache) ───────────────────
  function refreshUsers() {
    setUsersLoading(true);
    return apiGetAllUsers()
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }

  function refreshEvents() {
    setEventsLoading(true);
    return apiGetAllEvents()
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }

  useEffect(() => {
    refreshUsers();
    refreshEvents();
    apiGetRefunds()
      .then(data => { setRefunds(Array.isArray(data) ? data : []); setRefundsLoading(false); })
      .catch(() => { setRefunds([]); setRefundsLoading(false); });
    apiGetTestimonials()
      .then(data => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]));
    apiGetAdminStats()
      .then(data => setOverviewStats(data))
      .catch(() => setOverviewStats(null));
  }, []);

  function displayStatus(e) {
    if (e.approvalStatus === 'PENDING') return 'Pending';
    if (e.approvalStatus === 'REJECTED') return 'Rejected';
    if (!e.published) return 'Draft';
    const cap = Number(e.capacity) || 0;
    const reg = Number(e.attending ?? e.registered) || 0;
    return (cap > 0 && reg >= cap) ? 'Full' : 'Available';
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

  // ── Filtered testimonials ─────────────────────────────────────────────
  const filteredTestimonials = useMemo(() => {
    const q = testimonialSearch.toLowerCase();
    return testimonials.filter(t => {
      const name = t.user ? `${t.user.firstName} ${t.user.lastName}`.toLowerCase() : '';
      const ratingType = t.rating >= 4 ? 'positive' : 'negative';
      const filterOk = testimonialFilter === 'all' || ratingType === testimonialFilter;
      return filterOk && (!q || name.includes(q) || (t.content || '').toLowerCase().includes(q));
    });
  }, [testimonials, testimonialFilter, testimonialSearch]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalReg = overviewStats?.totalRegistrations ?? events.reduce((s, e) => s + (Number(e.attending) || 0), 0);
    const totalRev = overviewStats?.totalRevenue ?? events.reduce((s, e) => s + (Number(e.attending) || 0) * (Number(e.price) || 0), 0);
    return [
      { label: 'Total Events',   value: (overviewStats?.totalEvents ?? events.length).toLocaleString(),   sub: 'Live platform count', icon: 'ri-file-list-3-line' },
      { label: 'Total Users',    value: (overviewStats?.totalUsers ?? users.length).toLocaleString(),     sub: 'Live platform count', icon: 'ri-group-line' },
      { label: 'Total Revenue',  value: '$' + Number(totalRev).toLocaleString(),                          sub: 'From registrations × price', icon: 'ri-money-dollar-circle-line' },
      { label: 'Registrations',  value: Number(totalReg).toLocaleString(),                                 sub: 'Across all events', icon: 'ri-bar-chart-line' },
    ];
  }, [events, users, overviewStats]);

  const revenueChartData = useMemo(() => {
    if (!overviewStats?.monthlyRevenue?.length) return null;
    return {
      labels: overviewStats.monthlyRevenue.map(m => m.month),
      data: overviewStats.monthlyRevenue.map(m => m.revenue),
    };
  }, [overviewStats]);

  const categoryChartData = useMemo(() => {
    if (!overviewStats?.eventsByCategory?.length) return null;
    return {
      labels: overviewStats.eventsByCategory.map(c => c.category),
      data: overviewStats.eventsByCategory.map(c => c.count),
    };
  }, [overviewStats]);

  // ── Recent regs filter (real data from admin stats) ──────────────────────
  const recentRegs = overviewStats?.recentRegistrations || [];
  const filteredRecentRegs = useMemo(() =>
    recentRegs.filter(r => (r.name + ' ' + r.event).toLowerCase().includes(regSearch.toLowerCase())),
  [recentRegs, regSearch]);

  // ── User actions ─────────────────────────────────────────────────────────
  function openEdit(id) {
    const u = users.find(u => u.id === id);
    if (!u) return;
    setEditTarget(id);
    setEditRole(u.role === 'Supervisor' ? 'Admin' : u.role);
    setEditStatus(u.status);
    setModal('edit');
  }

  async function saveEdit() {
    setActionErr('');
    try {
      await apiUpdateUser(editTarget, { role: editRole, status: editStatus });
      await refreshUsers();
      setModal(null);
    } catch (err) {
      setActionErr(err.message || 'Failed to update user.');
    }
  }

  async function toggleSuspend(id) {
    const u = users.find(u => u.id === id);
    if (!u) return;
    const next = u.status === 'suspended' ? 'active' : 'suspended';
    try {
      await apiUpdateUser(id, { status: next });
      await refreshUsers();
    } catch (err) {
      setActionErr(err.message || 'Failed to update user status.');
    }
  }

  async function doDeleteUser() {
    if (!deleteTarget) { setModal(null); return; }
    try {
      await apiDeleteUser(deleteTarget);
      await refreshUsers();
      setModal(null);
    } catch (err) {
      setActionErr(err.message || 'Failed to delete user. Only the Supervisor account can delete users.');
      setModal(null);
    }
  }

  async function createUser() {
    setCreateErr('');
    const { firstName, lastName, email, password, role } = createForm;
    if (!firstName || !lastName || !email || !password) { setCreateErr('Please fill in all required fields.'); return; }
    if (password.length < 6) { setCreateErr('Password must be at least 6 characters.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setCreateErr('Please enter a valid email address.'); return; }
    try {
      await apiCreateUser({ firstName, lastName, email: email.toLowerCase(), password, role });
      await refreshUsers();
      setCreateForm({ firstName: '', lastName: '', email: '', password: '', role: 'Attendee' });
      setModal(null);
    } catch (err) {
      setCreateErr(err.message || 'Failed to create user.');
    }
  }

  // ── Event actions ─────────────────────────────────────────────────────────
  async function togglePublishEvent(id) {
    try {
      await apiTogglePublish(id);
      await refreshEvents();
      window.dispatchEvent(new CustomEvent('erms:events-updated'));
    } catch (err) {
      setActionErr(err.message || 'Failed to update event status.');
    }
  }

  async function approveEvent(id) {
    try {
      await apiApproveEvent(id);
      await refreshEvents();
      window.dispatchEvent(new CustomEvent('erms:events-updated'));
    } catch (err) {
      setActionErr(err.message || 'Failed to approve event.');
    }
  }

  async function rejectEvent(id) {
    try {
      await apiRejectEvent(id);
      await refreshEvents();
    } catch (err) {
      setActionErr(err.message || 'Failed to reject event.');
    }
  }

  async function doDeleteEvent() {
    if (!eventDeleteTarget) { setModal(null); return; }
    try {
      await apiDeleteEvent(eventDeleteTarget.id);
      await refreshEvents();
      window.dispatchEvent(new CustomEvent('erms:events-updated'));
      setModal(null);
    } catch (err) {
      setActionErr(err.message || 'Failed to delete event.');
      setModal(null);
    }
  }

  // ── Refund actions ────────────────────────────────────────────────────────
  function updateRefund(refund, status) {
    setRefunds(prev => prev.map(r => r.id === refund.id ? { ...r, status } : r));
    apiUpdateRefundStatus(refund.ticketCode, status).catch(() => {});
  }

  // ── Testimonial actions ──────────────────────────────────────────────────
  const [deleteTestimonialTarget, setDeleteTestimonialTarget] = useState(null);

  function doDeleteTestimonial() {
    if (!deleteTestimonialTarget) return;
    const target = deleteTestimonialTarget;
    setTestimonials(prev => prev.filter(t => t.id !== target.id));
    setDeleteTestimonialTarget(null);
    apiDeleteTestimonial(target.id)
      .catch(() => {
        // Rollback on failure
        setTestimonials(prev => [...prev, target].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      });
  }

  const meUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('erms_user') || 'null'); } catch { return null; }
  }, []);
  const myEmail = (meUser?.email || '').toLowerCase();

  return (
    <>
      {/* ── Navbar ── */}
      <DashboardNavbar />

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

          {actionErr && (
            <div className="card" style={{ padding: '10px 16px', marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{actionErr}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setActionErr('')}>Dismiss</button>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            {[
              { id: 'overview', label: 'Overview',      icon: 'ri-bar-chart-line' },
              { id: 'users',    label: 'Manage Users',  icon: 'ri-group-line' },
              { id: 'events',   label: 'Manage Events', icon: 'ri-calendar-event-line' },
              { id: 'approvals', label: 'Approvals',    icon: 'ri-check-double-line' },
              { id: 'refunds',  label: 'Refunds',       icon: 'ri-refund-2-line', badge: pendingRefundCount },
              { id: 'testimonials', label: 'Testimonials', icon: 'ri-chat-quote-line' },
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
                <div className="chart-card">
                  <h3>Monthly Revenue</h3>
                  {revenueChartData
                    ? <ChartCanvas id="revenueChart" labels={revenueChartData.labels} data={revenueChartData.data} />
                    : <p style={{ color: 'var(--text-light)', fontSize: 13 }}>No revenue data yet.</p>}
                </div>
                <div className="chart-card">
                  <h3>Events by Category</h3>
                  {categoryChartData
                    ? <ChartCanvas id="categoryChart" labels={categoryChartData.labels} data={categoryChartData.data} />
                    : <p style={{ color: 'var(--text-light)', fontSize: 13 }}>No events yet.</p>}
                </div>
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
                      {filteredRecentRegs.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No registrations yet.</td></tr>
                      ) : filteredRecentRegs.map((r, i) => {
                        const [bg, fg] = AVATAR_BG.Attendee;
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="avatar-circle" style={{ background: bg, color: fg }}>{(r.name || '?').charAt(0).toUpperCase()}</div>
                                {r.name}
                              </div>
                            </td>
                            <td>{r.event}</td>
                            <td><i className="ri-time-line" /> {r.date}</td>
                            <td>${Number(r.amount || 0).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${REFUND_BADGE[r.status] || 'badge-confirmed'}`}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
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

              {usersLoading ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map(i => (
                        <tr key={i}>
                          {[1, 2, 3, 4, 5, 6].map(j => (
                            <td key={j}>
                              <div style={{ background: 'var(--border)', height: 16, width: j === 1 ? '70%' : j === 2 ? '60%' : j === 3 ? '45%' : j === 4 ? '35%' : j === 5 ? '40%' : '30%', borderRadius: 4, margin: '4px 0' }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No users match this filter.</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const [bg, fg] = AVATAR_BG[u.role] || ['#e2e8f0','#475569'];
                        const isProtected = u.role === 'Supervisor' || u.email.toLowerCase() === myEmail;
                        return (
                          <tr key={u.id} className={u.status === 'suspended' ? 'muted-row' : ''}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="avatar-circle" style={{ background: bg, color: fg }}>{initial(u)}</div>
                                {fullName(u)}
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td><span className={`badge ${ROLE_BADGE[u.role] || ''}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                            <td>
                              {u.status === 'suspended'
                                ? <span className="badge badge-cancelled"><i className="ri-forbid-line" /> Suspended</span>
                                : <span className="badge badge-confirmed"><i className="ri-checkbox-circle-line" /> Active</span>}
                            </td>
                            <td>{fmtDate(u.createdAt) || '—'}</td>
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
                                  <button className="btn btn-outline btn-sm" title="Edit" onClick={() => openEdit(u.id)}><i className="ri-edit-line" /></button>
                                  <button className="btn btn-outline btn-sm" title={u.status === 'suspended' ? 'Unsuspend' : 'Suspend'} onClick={() => toggleSuspend(u.id)}>
                                    <i className={u.status === 'suspended' ? 'ri-check-line' : 'ri-forbid-line'} />
                                  </button>
                                  <button className="btn btn-danger btn-sm" title="Delete" onClick={() => { setDeleteTarget(u.id); setModal('delete'); }}>
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
              )}
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
                {['all','Pending','Available','Full','Draft','Rejected'].map(s => (
                  <button key={s} className={`role-pill${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>

              <div className="adm-search">
                <i className="ri-search-line" />
                <input type="text" placeholder="Search by title or category..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
              </div>

              {eventsLoading ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Event Title</th><th>Organizer</th><th>Category</th><th>Date</th><th>Registered</th><th>Revenue</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map(i => (
                        <tr key={i}>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                            <td key={j}>
                              <div style={{ background: 'var(--border)', height: 16, width: j === 1 ? '70%' : j === 2 ? '50%' : j === 3 ? '40%' : j === 4 ? '45%' : j === 5 ? '35%' : j === 6 ? '30%' : '30%', borderRadius: 4, margin: '4px 0' }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : events.length === 0 ? (
                <div className="empty-state"><p>No events yet. Events created by organizers will appear here.</p></div>
              ) : filteredEvents.length === 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Event Title</th><th>Organizer</th><th>Category</th><th>Date</th><th>Registered</th><th>Revenue</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No events match this filter.</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Event Title</th><th>Organizer</th><th>Category</th><th>Date</th><th>Registered</th><th>Revenue</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map(e => {
                        const st = displayStatus(e);
                        const reg = Number(e.attending ?? e.registered) || 0;
                        const revenue = (reg * (Number(e.price) || 0)).toLocaleString();
                        const cap = Number(e.capacity) || 0;
                        const isPending = st === 'Pending';
                        const isDraftLike = st === 'Draft';
                        return (
                          <tr key={e.id} className={(isPending || isDraftLike) ? 'muted-row' : ''}>
                            <td style={{ fontWeight: 500 }}>{e.title}</td>
                            <td>{e.organizer ? fullName(e.organizer) : '—'}</td>
                            <td>{e.category || '—'}</td>
                            <td>{fmtDate(e.date, 'long') || '—'}</td>
                            <td>{reg.toLocaleString()}{cap ? ` / ${cap.toLocaleString()}` : ''}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>${revenue}</td>
                            <td><span className={`badge ${STATUS_BADGE[st] || ''}`}>{st}</span></td>
                            <td>
                              <div className="action-btns">
                                <button className="btn btn-outline btn-sm" title="View" onClick={() => navigate('/events/' + e.id)}>
                                  <i className="ri-eye-line" />
                                </button>
                                {isPending ? (
                                  <>
                                    <button className="btn btn-success btn-sm" title="Approve" onClick={() => approveEvent(e.id)}><i className="ri-check-line" /></button>
                                    <button className="btn btn-danger btn-sm" title="Reject" onClick={() => rejectEvent(e.id)}><i className="ri-close-line" /></button>
                                  </>
                                ) : e.approvalStatus === 'APPROVED' ? (
                                  e.published
                                    ? <button className="btn btn-outline btn-sm" title="Unpublish" onClick={() => togglePublishEvent(e.id)}><i className="ri-eye-off-line" /></button>
                                    : <button className="btn btn-success btn-sm" title="Publish" onClick={() => togglePublishEvent(e.id)}><i className="ri-eye-line" /></button>
                                ) : null}
                                <button className="btn btn-danger btn-sm" title="Delete" onClick={() => { setEventDeleteTarget({ id: e.id, title: e.title }); setModal('eventDelete'); }}>
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
              )}
            </div>
          )}

          {/* ════════ APPROVALS ════════ */}
          {activeTab === 'approvals' && (
            <div className="tab-content active">
              <div className="section-header-row">
                <div className="section-title" style={{ margin: 0 }}>Event Approvals</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  <i className="ri-check-double-line" /> Manage pending event submissions
                </div>
              </div>

              {(() => {
                const pendingEvents = events.filter(e => e.approvalStatus === 'PENDING');
                if (pendingEvents.length === 0) {
                  return (
                    <div className="empty-state">
                      <i className="ri-checkbox-circle-line" style={{ fontSize: 40, color: 'var(--success)', marginBottom: 12 }} />
                      <p>All events have been reviewed. No pending approvals.</p>
                    </div>
                  );
                }
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Event Title</th>
                          <th>Organizer</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Capacity</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingEvents.map(e => (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 500 }}>{e.title}</td>
                            <td>{e.organizer ? fullName(e.organizer) : '—'}</td>
                            <td>{e.category || '—'}</td>
                            <td>{fmtDate(e.date, 'long') || '—'}</td>
                            <td>{Number(e.capacity) || '—'}</td>
                            <td style={{ fontWeight: 600 }}>${Number(e.price) || 0}</td>
                            <td>
                              <span className="badge badge-pending">
                                <i className="ri-time-line" /> Pending
                              </span>
                            </td>
                            <td>
                              <div className="action-btns">
                                <button className="btn btn-success btn-sm" title="Approve event" onClick={() => approveEvent(e.id)}>
                                  <i className="ri-check-line" /> Approve
                                </button>
                                <button className="btn btn-danger btn-sm" title="Reject event" onClick={() => rejectEvent(e.id)}>
                                  <i className="ri-close-line" /> Reject
                                </button>
                                <button className="btn btn-outline btn-sm" title="View details" onClick={() => navigate('/events/' + e.id)}>
                                  <i className="ri-eye-line" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
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

              {refundsLoading ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>User</th><th>Ticket</th><th>Event</th><th>Reason</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map(i => (
                        <tr key={i}>
                          {[1, 2, 3, 4, 5, 6, 7].map(j => (
                            <td key={j}>
                              <div style={{ background: 'var(--border)', height: 16, width: j === 1 ? '60%' : j === 2 ? '45%' : j === 3 ? '55%' : j === 4 ? '50%' : j === 5 ? '40%' : j === 6 ? '35%' : '30%', borderRadius: 4, margin: '4px 0' }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredRefunds.length === 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>User</th><th>Ticket</th><th>Event</th><th>Reason</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No refund requests found.</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>User</th><th>Ticket</th><th>Event</th><th>Reason</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredRefunds.map((r) => {
                        const userName = r.user ? `${r.user.firstName} ${r.user.lastName}` : '—';
                        const date = fmtDate(r.requestedAt) || '—';
                        return (
                          <tr key={r.id || r.ticketCode}>
                            <td style={{ whiteSpace: 'nowrap' }}>{userName}</td>
                            <td style={{ fontWeight: 500 }}>{r.ticketCode || '—'}</td>
                            <td>{r.eventName || '—'}</td>
                            <td>{r.reason || '—'}</td>
                            <td>{date}</td>
                            <td><span className={`badge ${REFUND_BADGE[r.status] || ''}`}>{REFUND_LABEL[r.status] || r.status}</span></td>
                            <td>
                              {r.status === 'pending' ? (
                                <div className="action-btns">
                                  <button className="btn btn-success btn-sm" onClick={() => updateRefund(r, 'approved')}>
                                    <i className="ri-check-line" /> Approve
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => updateRefund(r, 'rejected')}>
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
              )}
            </div>
          )}

          {/* ════════ TESTIMONIALS ════════ */}
          {activeTab === 'testimonials' && (
            <div className="tab-content active">
              <div className="section-header-row">
                <div className="section-title" style={{ margin: 0 }}>Testimonials</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  <i className="ri-chat-quote-line" /> {testimonials.length} reviews
                </div>
              </div>

              <div className="role-filter">
                {['all','positive','negative'].map(s => (
                  <button key={s} className={`role-pill${testimonialFilter === s ? ' active' : ''}`} onClick={() => setTestimonialFilter(s)}>
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="adm-search">
                <i className="ri-search-line" />
                <input type="text" placeholder="Search by name or content..." value={testimonialSearch} onChange={e => setTestimonialSearch(e.target.value)} />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>User</th><th>Review</th><th>Rating</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredTestimonials.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 26, fontStyle: 'italic' }}>No testimonials found.</td></tr>
                    ) : filteredTestimonials.map(t => {
                      const name = t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Anonymous';
                      const date = fmtDate(t.createdAt) || '—';
                      return (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{name}</td>
                          <td style={{ maxWidth: 340 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.content}</span></td>
                          <td>
                            <span style={{ color: t.rating >= 4 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{date}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTestimonialTarget(t)}>
                              <i className="ri-delete-bin-line" /> Delete
                            </button>
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
                  { key: 'Status',   val: viewUser.status === 'suspended' ? 'Suspended' : 'Active' },
                  { key: 'Joined',   val: fmtDate(viewUser.createdAt) || '—' },
                  { key: 'Phone',    val: viewUser.phone || '—' },
                  { key: 'Address',  val: viewUser.address || '—' },
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
            Editing <strong>{users.find(u => u.id === editTarget) ? fullName(users.find(u => u.id === editTarget)) : ''}</strong>
          </p>
          <label className="adm-field-label">Role</label>
          <select className="adm-field-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
            <option value="Attendee">Attendee</option>
            <option value="Organizer">Organizer</option>
            <option value="Admin">Admin</option>
          </select>
          <label className="adm-field-label">Status</label>
          <select className="adm-field-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
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
            <strong>{users.find(u => u.id === deleteTarget) ? fullName(users.find(u => u.id === deleteTarget)) : ''}</strong>?
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

      {/* ══ Delete Testimonial Modal ══ */}
      <div className={`adm-modal-overlay${deleteTestimonialTarget ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setDeleteTestimonialTarget(null); }}>
        <div className="adm-modal-box">
          <div className="adm-modal-head">
            <div className="adm-modal-icon danger"><i className="ri-delete-bin-line" /></div>
            <h3>Delete Testimonial</h3>
            <button className="m-close" onClick={() => setDeleteTestimonialTarget(null)}>&times;</button>
          </div>
          <p className="adm-modal-text">
            Are you sure you want to delete this testimonial by{' '}
            <strong>{deleteTestimonialTarget?.user ? `${deleteTestimonialTarget.user.firstName} ${deleteTestimonialTarget.user.lastName}` : 'Anonymous'}</strong>?
            {' '}This cannot be undone.
          </p>
          <div className="adm-modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleteTestimonialTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doDeleteTestimonial}><i className="ri-delete-bin-line" /> Delete</button>
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

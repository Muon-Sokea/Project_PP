import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import '../../assets/css/6_dashboard.css';
import './SuperadminDashboard.css';

const SA_RESERVED = [
  { firstName:'Muon',    lastName:'Sokea',      email:'muonsokea@gmail.com',     role:'Supervisor', joined:'Jan 10, 2026' },
  { firstName:'San',     lastName:'Sotheayuth', email:'sansotheayuth@gmail.com', role:'Admin',      joined:'Jan 10, 2026' },
  { firstName:'Proeung', lastName:'Sivly',      email:'proeungsivly@gmail.com',  role:'Organizer',  joined:'Jan 10, 2026' },
  { firstName:'Lang',    lastName:'Socheat',    email:'langsocheat@gmail.com',   role:'Attendee',   joined:'Jan 10, 2026' },
];
const OVER_KEY = 'erms_admin_overrides';
const ROLE_BADGE = { Supervisor:'badge-role-supervisor', Admin:'badge-role-admin', Organizer:'badge-role-organizer', Attendee:'badge-role-attendee' };
const ROLE_LABEL = { Supervisor:'Super Admin', Admin:'Admin', Organizer:'Organizer', Attendee:'Attendee' };
const AVATAR_CLR = { Supervisor:['#fef9c3','#a16207'], Admin:['#dbeafe','#1d4ed8'], Organizer:['#fce7f3','#be185d'], Attendee:['#dcfce7','#15803d'] };

const SA_EVENTS = [
  { id:1, title:'Tech Innovation Summit 2026',   organizer:'Proeung Sivly', date:'April 30, 2026',  category:'Technology', registered:'1000 / 2300', revenue:'$250,000', status:'Available' },
  { id:2, title:'Pre-Event Planning Workshop',   organizer:'Proeung Sivly', date:'March 20, 2026',  category:'Workshop',   registered:'1250 / 1250', revenue:'$375,000', status:'Full' },
  { id:3, title:'Business Leadership Conference',organizer:'Proeung Sivly', date:'March 20, 2026',  category:'Business',   registered:'2500 / 3000', revenue:'$1,125,000',status:'Available' },
  { id:4, title:'Sport Event 2026',              organizer:'Proeung Sivly', date:'March 20, 2026',  category:'Sports',     registered:'1250 / 2000', revenue:'$375,000', status:'Available' },
];
const AUDIT_ROWS = [
  { ts:'2026-03-27 08:42:11', user:'Muon Sokea',     role:'Supervisor', action:'System login',              ip:'192.168.1.1', ok:true },
  { ts:'2026-03-27 09:10:33', user:'San Sotheayuth', role:'Admin',      action:'Viewed registrations',      ip:'192.168.1.2', ok:true },
  { ts:'2026-03-27 09:35:02', user:'Unknown',        role:'—',          action:'Failed login attempt',      ip:'203.45.67.89',ok:false },
  { ts:'2026-03-27 10:00:15', user:'Proeung Sivly',  role:'Organizer',  action:'Created new event',         ip:'192.168.1.3', ok:true },
  { ts:'2026-03-27 10:22:44', user:'Lang Socheat',   role:'Attendee',   action:'Registered for event',      ip:'192.168.1.4', ok:true },
  { ts:'2026-03-27 11:05:30', user:'Muon Sokea',     role:'Supervisor', action:'Updated system settings',   ip:'192.168.1.1', ok:true },
  { ts:'2026-03-27 11:30:00', user:'San Sotheayuth', role:'Admin',      action:'Exported financial report', ip:'192.168.1.2', ok:true },
];

function loadLS(key, fb) { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } }
function saveLS(key, v)  { localStorage.setItem(key, JSON.stringify(v)); }

function ChartCanvas({ id }) {
  const ref = useRef(null);
  useEffect(() => {
    let chart;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = ref.current;
      if (!ctx) return;
      const configs = {
        revenueChart: {
          type:'line',
          data:{
            labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
            datasets:[{ data:[45000,52000,48000,60000,55000,72000], borderColor:'#4A90D9', backgroundColor:'rgba(74,144,217,0.08)', tension:0.4, fill:true, pointBackgroundColor:'#4A90D9', pointRadius:4 }],
          },
          options:{ plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } },
        },
        categoryChart: {
          type:'bar',
          data:{
            labels:['Technology','Business','Workshop','Entertainment','Sports'],
            datasets:[{ data:[45,31,28,32,15], backgroundColor:'#4A90D9', borderRadius:4 }],
          },
          options:{ plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } },
        },
        financialChart: {
          type:'bar',
          data:{
            labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
            datasets:[
              { label:'Revenue', data:[45000,52000,48000,60000,55000,72000], backgroundColor:'rgba(245,166,35,0.8)', borderRadius:4 },
              { label:'Refunds', data:[1200,1800,900,2100,1500,2400],       backgroundColor:'rgba(220,53,69,0.7)',  borderRadius:4 },
            ],
          },
          options:{ plugins:{legend:{display:true,position:'top'}}, scales:{ y:{beginAtZero:true,grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } },
        },
        healthChart: {
          type:'line',
          data:{
            labels:['00:00','04:00','08:00','12:00','16:00','20:00'],
            datasets:[
              { label:'CPU',    data:[60,55,50,80,75,72], borderColor:'#dc3545', tension:0.4, pointRadius:3, fill:false },
              { label:'Memory', data:[62,60,65,75,70,68], borderColor:'#4A90D9', tension:0.4, pointRadius:3, fill:false },
              { label:'Disk',   data:[40,41,41,42,42,42], borderColor:'#28a745', tension:0.4, pointRadius:3, fill:false },
            ],
          },
          options:{ plugins:{legend:{display:true,position:'top'}}, scales:{ y:{beginAtZero:true,max:100,grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } },
        },
      };
      const cfg = configs[id];
      if (cfg) chart = new Chart(ctx, cfg);
    }).catch(() => {});
    return () => { if (chart) chart.destroy(); };
  }, [id]);
  return <canvas ref={ref} id={id} height={id === 'healthChart' ? 120 : 180} />;
}

export default function SuperadminDashboard() {
  const { logout, syncSession } = useAuth();
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState('overview');
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [userSearch,   setUserSearch]   = useState('');
  const [eventFilter,  setEventFilter]  = useState('all');
  const [eventSearch,  setEventSearch]  = useState('');
  const [auditSearch,  setAuditSearch]  = useState('');
  const [modal,        setModal]        = useState(null); // 'create' | 'delete'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createForm,   setCreateForm]   = useState({ firstName:'', lastName:'', email:'', password:'', role:'Admin' });
  const [createErr,    setCreateErr]    = useState('');
  const [tick,         setTick]         = useState(0);
  const [navOpen,      setNavOpen]      = useState(false);
  const [navScrolled,  setNavScrolled]  = useState(false);
  const [settings,     setSettings]     = useState({ emailNotif:true, smsNotif:true, pushNotif:false, autoBackup:true, twoFactor:true, forceReset:false, sessionTimeout:'30 minutes', passwordComplexity:'High', maxLogin:'3 attempts' });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('erms_user')); } catch { return null; }
  }, [tick]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getUsers = useCallback(() => {
    const ov   = loadLS(OVER_KEY, {});
    const reserved = SA_RESERVED.map(u => {
      const o = ov[u.email] || {};
      return { ...u, role: o.role || u.role, status: o.status || 'Active', deleted: !!o.deleted, src:'reserved' };
    }).filter(u => !u.deleted);
    const attendees = loadLS('erms_attendees', []).map(u => ({
      firstName: u.firstName||'', lastName: u.lastName||'', email: u.email||'',
      role: u.role||'Attendee', status: u.status||'Active',
      joined: u.joined || (Number(u.id) > 1e12 ? new Date(Number(u.id)).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'),
      src:'attendee',
    }));
    return [...reserved, ...attendees];
  }, [tick]);

  const allUsers = getUsers();
  const myEmail = (user?.email || '').toLowerCase();

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return allUsers.filter(u => {
      const name = `${u.firstName} ${u.lastName}`.trim();
      const roleOk = roleFilter === 'all' || u.role === roleFilter;
      return roleOk && (name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    });
  }, [allUsers, roleFilter, userSearch]);

  const filteredEvents = useMemo(() => {
    const q = eventSearch.toLowerCase();
    return SA_EVENTS.filter(e => {
      const statusOk = eventFilter === 'all' || e.status === eventFilter;
      return statusOk && (e.title.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q));
    });
  }, [eventFilter, eventSearch]);

  const filteredAudit = useMemo(() => {
    const q = auditSearch.toLowerCase();
    if (!q) return AUDIT_ROWS;
    return AUDIT_ROWS.filter(r => (r.user + r.action + r.role + r.ip).toLowerCase().includes(q));
  }, [auditSearch]);

  function toggleSuspend(email) {
    const u = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!u) return;
    const next = u.status === 'Suspended' ? 'Active' : 'Suspended';
    if (u.src === 'attendee') {
      const list = loadLS('erms_attendees', []);
      const i = list.findIndex(a => (a.email||'').toLowerCase() === email.toLowerCase());
      if (i !== -1) { list[i].status = next; saveLS('erms_attendees', list); }
    } else {
      const ov = loadLS(OVER_KEY, {});
      ov[u.email] = { ...(ov[u.email]||{}), status: next };
      saveLS(OVER_KEY, ov);
    }
    setTick(t => t + 1);
  }

  function openDelete(email) {
    setDeleteTarget(email);
    setModal('delete');
  }

  function confirmDelete() {
    if (!deleteTarget) { setModal(null); return; }
    const u = getUsers().find(u => u.email.toLowerCase() === deleteTarget.toLowerCase());
    if (u) {
      if (u.src === 'attendee') {
        saveLS('erms_attendees', loadLS('erms_attendees', []).filter(a => (a.email||'').toLowerCase() !== deleteTarget.toLowerCase()));
      } else {
        const ov = loadLS(OVER_KEY, {});
        ov[u.email] = { ...(ov[u.email]||{}), deleted: true };
        saveLS(OVER_KEY, ov);
      }
    }
    setModal(null);
    setDeleteTarget(null);
    setTick(t => t + 1);
  }

  function createUser() {
    setCreateErr('');
    const { firstName, lastName, email, password, role } = createForm;
    if (!firstName || !lastName || !email || !password) { setCreateErr('Please fill in all required fields.'); return; }
    if (password.length < 6) { setCreateErr('Password must be at least 6 characters.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setCreateErr('Please enter a valid email address.'); return; }
    const lc = email.toLowerCase();
    if (getUsers().some(u => u.email.toLowerCase() === lc)) { setCreateErr('An account with this email already exists.'); return; }
    const list = loadLS('erms_attendees', []);
    list.push({ id: Date.now(), firstName, lastName, email: lc, role, status:'Active', joined: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) });
    saveLS('erms_attendees', list);
    setCreateForm({ firstName:'', lastName:'', email:'', password:'', role:'Admin' });
    setModal(null);
    setTick(t => t + 1);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const deleteUser = deleteTarget ? getUsers().find(u => u.email.toLowerCase() === deleteTarget.toLowerCase()) : null;

  return (
    <>
      <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
        <Link className="nav-logo" to="/">
          <span className="logo-top">Planning</span>
          <span className="logo-bottom">Center</span>
        </Link>
        <button className="hamburger" id="hamburger" onClick={() => setNavOpen(o => !o)}>
          <span /><span /><span />
        </button>
        <div className={`nav-links${navOpen ? ' open' : ''}`}>
          <Link to="/" className="btn btn-outline"><i className="ri-home-line" /> Home</Link>
          <button className="btn btn-primary"><i className="ri-dashboard-line" /> Dashboard</button>
          <button className="btn btn-outline" onClick={handleLogout}><i className="ri-logout-box-r-line" /> Logout</button>
        </div>
      </nav>

      <div className="dashboard-page">

        <div className="dashboard-header">
          <div>
            <h1>System Administrator Dashboard</h1>
            <p>Complete platform control and monitoring</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            {user && <span style={{ fontSize:'13px', color:'var(--text-medium)' }}>Welcome, {user.firstName} {user.lastName}</span>}
            <button className="btn btn-outline btn-sm" onClick={() => alert('System report exported!')}>
              <i className="ri-download-line" /> Export Report
            </button>
          </div>
        </div>

        <div className="dashboard-body">

          {/* Tabs */}
          <div className="tabs">
            {[
              ['overview',  'ri-bar-chart-line',          'Overview'],
              ['users',     'ri-group-line',               'All Users'],
              ['events',    'ri-calendar-event-line',      'All Events'],
              ['financial', 'ri-money-dollar-circle-line', 'Financial'],
              ['settings',  'ri-settings-3-line',          'System Settings'],
              ['audit',     'ri-file-text-line',           'Audit Logs'],
              ['health',    'ri-computer-line',            'System Health'],
            ].map(([id, icon, label]) => (
              <button key={id} className={`tab-btn${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
                <i className={icon} /> {label}
              </button>
            ))}
          </div>

          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="tab-content active">
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-card-info">
                    <div className="label">Total Users</div>
                    <div className="value">15,890</div>
                    <div style={{ fontSize:'12px', color:'var(--success)' }}>+8% from last month</div>
                  </div>
                  <div className="stat-card-icon"><i className="ri-group-line" /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-info">
                    <div className="label">Total Events</div>
                    <div className="value">200</div>
                    <div style={{ fontSize:'12px', color:'var(--success)' }}>+12% from last month</div>
                  </div>
                  <div className="stat-card-icon"><i className="ri-calendar-event-line" /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-info">
                    <div className="label">Total Revenue</div>
                    <div className="value">$1,000,000</div>
                    <div style={{ fontSize:'12px', color:'var(--success)' }}>+20% from last month</div>
                  </div>
                  <div className="stat-card-icon"><i className="ri-money-dollar-circle-line" /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-info">
                    <div className="label">Registrations</div>
                    <div className="value">9,430</div>
                    <div style={{ fontSize:'12px', color:'var(--success)' }}>+15% from last month</div>
                  </div>
                  <div className="stat-card-icon"><i className="ri-ticket-2-line" /></div>
                </div>
              </div>

              <div className="charts-row">
                <div className="chart-card">
                  <h3>Monthly Revenue</h3>
                  <ChartCanvas id="revenueChart" />
                </div>
                <div className="chart-card">
                  <h3>Events by Category</h3>
                  <ChartCanvas id="categoryChart" />
                </div>
              </div>

              <div className="card" style={{ padding:'20px' }}>
                <div className="sa-section-header">
                  <div className="section-title" style={{ margin:0 }}>Recent Registrations</div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Attendee</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {[
                        { init:'M', bg:'badge-role-admin',      name:'Muon Sokea',     event:'Tech Innovation Summit 2026',  date:'March 13, 2026', amt:'$300', status:'confirmed', label:'Confirmed' },
                        { init:'P', bg:'badge-role-organizer',  name:'Proeung Sivly',  event:'Business Leadership Conference',date:'March 13, 2026', amt:'$450', status:'pending',   label:'Pending'   },
                        { init:'S', bg:'badge-role-attendee',   name:'San Sotheayuth', event:'Digital Marketing Workshop',   date:'March 13, 2026', amt:'$300', status:'confirmed', label:'Confirmed' },
                        { init:'L', bg:'badge-role-supervisor', name:'Lang Socheat',   event:'Networking & Innovation Forum', date:'March 13, 2026', amt:'$300', status:'cancelled', label:'Cancelled' },
                      ].map((r, i) => (
                        <tr key={i}>
                          <td><div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div className={`avatar-circle ${r.bg}`}>{r.init}</div>{r.name}
                          </div></td>
                          <td>{r.event}</td>
                          <td>{r.date}</td>
                          <td>{r.amt}</td>
                          <td><span className={`badge badge-${r.status}`}>
                            <i className={r.status === 'confirmed' ? 'ri-checkbox-circle-line' : r.status === 'pending' ? 'ri-time-line' : 'ri-close-circle-line'} /> {r.label}
                          </span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: ALL USERS ── */}
          {activeTab === 'users' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>
                  All Users &nbsp;<span style={{ fontSize:'13px', color:'var(--text-light)', fontWeight:400 }}>{allUsers.length} total</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setCreateErr(''); setModal('create'); }}>
                  <i className="ri-user-add-line" /> Add User
                </button>
              </div>

              <div className="sa-role-filter">
                {[['all','All Users'],['Supervisor','Super Admin'],['Admin','Admin'],['Organizer','Organizer'],['Attendee','Attendee']].map(([val, label]) => (
                  <button key={val} className={`sa-role-pill${roleFilter === val ? ' active' : ''}`} onClick={() => setRoleFilter(val)}>{label}</button>
                ))}
              </div>

              <div className="sa-table-search">
                <i className="ri-search-line" />
                <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>

              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign:'center', padding:'26px', color:'var(--text-light)' }}>No users match this filter.</td></tr>
                    ) : filteredUsers.map((u, i) => {
                      const [bg, fg] = AVATAR_CLR[u.role] || ['#e2e8f0','#475569'];
                      const isSelf = u.email.toLowerCase() === myEmail;
                      const isSA   = u.role === 'Supervisor';
                      const name   = `${u.firstName} ${u.lastName}`.trim() || u.email;
                      const init   = (u.firstName || u.email || '?').charAt(0).toUpperCase();
                      return (
                        <tr key={i} className={u.status === 'Suspended' ? 'sa-muted-row' : ''}>
                          <td><div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div className="avatar-circle" style={{ background:bg, color:fg }}>{init}</div>{name}
                          </div></td>
                          <td>{u.email}</td>
                          <td><span className={`badge ${ROLE_BADGE[u.role]||''}`}>{ROLE_LABEL[u.role]||u.role}</span></td>
                          <td>
                            {u.status === 'Suspended'
                              ? <span className="badge badge-cancelled"><i className="ri-forbid-line" /> Suspended</span>
                              : <span className="badge badge-confirmed"><i className="ri-checkbox-circle-line" /> Active</span>}
                          </td>
                          <td>{u.joined}</td>
                          <td>
                            {(isSelf || isSA)
                              ? <span style={{ fontSize:'11px', color:'var(--text-light)' }}>{isSA && isSelf ? 'You · Protected' : isSelf ? 'You' : 'Protected'}</span>
                              : <div className="action-btns">
                                  <button className="btn btn-outline btn-sm" title={u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'} onClick={() => toggleSuspend(u.email)}>
                                    <i className={u.status === 'Suspended' ? 'ri-check-line' : 'ri-forbid-line'} />
                                  </button>
                                  <button className="btn btn-danger btn-sm" title="Delete" onClick={() => openDelete(u.email)}>
                                    <i className="ri-delete-bin-line" />
                                  </button>
                                </div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: ALL EVENTS ── */}
          {activeTab === 'events' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>All Events</div>
                <div className="sa-table-search" style={{ margin:0 }}>
                  <i className="ri-search-line" />
                  <input type="text" placeholder="Search events..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
                </div>
              </div>

              <div className="sa-role-filter">
                {[['all','All Events'],['Available','Available'],['Full','Full']].map(([val, label]) => (
                  <button key={val} className={`sa-role-pill${eventFilter === val ? ' active' : ''}`} onClick={() => setEventFilter(val)}>{label}</button>
                ))}
              </div>

              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Event Title</th><th>Organizer</th><th>Date</th><th>Category</th><th>Registered</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredEvents.map((e, i) => (
                      <tr key={i}>
                        <td>{e.title}</td>
                        <td>{e.organizer}</td>
                        <td>{e.date}</td>
                        <td>{e.category}</td>
                        <td>{e.registered}</td>
                        <td style={{ color:'var(--success)', fontWeight:600 }}>{e.revenue}</td>
                        <td><span className={`badge badge-${e.status === 'Full' ? 'full' : 'available'}`}>{e.status}</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-outline btn-sm" onClick={() => alert('View event details')}><i className="ri-eye-line" /></button>
                            <button className="btn btn-outline btn-sm" onClick={() => alert('Edit event')}><i className="ri-edit-line" /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => alert(`Delete ${e.title}`)}><i className="ri-delete-bin-line" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 4: FINANCIAL ── */}
          {activeTab === 'financial' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>Financial Reports</div>
                <button className="btn btn-outline btn-sm" onClick={() => alert('Exporting financial report...')}>
                  <i className="ri-file-excel-line" /> Export CSV
                </button>
              </div>

              <div className="financial-cards">
                {[
                  { label:'Total Revenue',     value:'$1,000,000', trend:'+20% vs last month', up:true },
                  { label:'This Month',         value:'$72,000',    trend:'+15% vs last month', up:true },
                  { label:'Total Tickets Sold', value:'9,430',      trend:'+12% vs last month', up:true },
                  { label:'Avg. Ticket Price',  value:'$106',       trend:'+5% vs last month',  up:true },
                  { label:'Refunds Processed',  value:'$12,400',    trend:'124 refunds',         up:false },
                  { label:'Net Revenue',        value:'$987,600',   trend:'After refunds',       up:true },
                ].map((c, i) => (
                  <div className="financial-card" key={i}>
                    <div className="f-label">{c.label}</div>
                    <div className="f-value">{c.value}</div>
                    <div className={c.up ? 'f-trend' : ''} style={!c.up ? { fontSize:'12px', color:'var(--danger)' } : {}}>
                      <i className={`ri-arrow-${c.up ? 'up' : 'down'}-line`} /> {c.trend}
                    </div>
                  </div>
                ))}
              </div>

              <div className="chart-card" style={{ marginBottom:'20px' }}>
                <h3>Monthly Revenue Breakdown</h3>
                <ChartCanvas id="financialChart" />
              </div>

              <div className="section-title">Revenue by Event</div>
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Event</th><th>Category</th><th>Tickets Sold</th><th>Ticket Price</th><th>Gross Revenue</th><th>Refunds</th><th>Net Revenue</th></tr></thead>
                  <tbody>
                    {[
                      { title:'Tech Innovation Summit 2026',   cat:'Technology', sold:'1,000', price:'$250',  gross:'$250,000',   ref:'-$2,500', net:'$247,500'   },
                      { title:'Pre-Event Planning Workshop',   cat:'Workshop',   sold:'1,250', price:'$300',  gross:'$375,000',   ref:'-$3,000', net:'$372,000'   },
                      { title:'Business Leadership Conference',cat:'Business',   sold:'2,500', price:'$450',  gross:'$1,125,000', ref:'-$4,500', net:'$1,120,500' },
                      { title:'Music Festival 2026',           cat:'Entertainment',sold:'5,230',price:'$100', gross:'$523,000',   ref:'-$2,400', net:'$520,600'   },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td>{r.title}</td><td>{r.cat}</td><td>{r.sold}</td><td>{r.price}</td>
                        <td>{r.gross}</td>
                        <td style={{ color:'var(--danger)' }}>{r.ref}</td>
                        <td style={{ color:'var(--success)', fontWeight:600 }}>{r.net}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 5: SYSTEM SETTINGS ── */}
          {activeTab === 'settings' && (
            <div className="tab-content active">
              <div className="section-title">System Configuration</div>

              <div className="card" style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <i className="ri-notification-3-line" style={{ color:'var(--primary)' }} /> Notification Settings
                </div>
                {[
                  { key:'emailNotif', label:'Email Notifications',   sub:'Send email notifications to all users' },
                  { key:'smsNotif',   label:'SMS Notifications',     sub:'Send SMS alerts to registered users' },
                  { key:'pushNotif',  label:'Push Notifications',    sub:'Send browser push notifications', last:true },
                ].map(({ key, label, sub, last }) => (
                  <div className="toggle-row" key={key} style={last ? { border:'none' } : {}}>
                    <div><div className="t-label">{label}</div><div className="t-sub">{sub}</div></div>
                    <button className={`sa-toggle ${settings[key] ? 'on' : 'off'}`} onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))} />
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <i className="ri-database-2-line" style={{ color:'var(--success)' }} /> Database Settings
                </div>
                <div className="toggle-row">
                  <div><div className="t-label">Automatic Backups</div><div className="t-sub">Daily automated database backups at 2:00 AM</div></div>
                  <button className={`sa-toggle ${settings.autoBackup ? 'on' : 'off'}`} onClick={() => setSettings(s => ({ ...s, autoBackup: !s.autoBackup }))} />
                </div>
                <div style={{ marginTop:'12px', display:'flex', gap:'10px' }}>
                  <button className="btn btn-success btn-sm" onClick={() => alert('Downloading latest backup...')}><i className="ri-download-line" /> Download Latest Backup</button>
                  <button className="btn btn-outline btn-sm" onClick={() => alert('Manual backup started!')}><i className="ri-refresh-line" /> Run Backup Now</button>
                </div>
              </div>

              <div className="card" style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <i className="ri-shield-check-line" style={{ color:'var(--danger)' }} /> Security Settings
                </div>
                <div className="toggle-row">
                  <div><div className="t-label">Two-Factor Authentication</div><div className="t-sub">Require 2FA for all administrators</div></div>
                  <button className={`sa-toggle ${settings.twoFactor ? 'on' : 'off'}`} onClick={() => setSettings(s => ({ ...s, twoFactor: !s.twoFactor }))} />
                </div>
                <div className="toggle-row" style={{ border:'none' }}>
                  <div><div className="t-label">Force Password Reset</div><div className="t-sub">Require password change every 90 days</div></div>
                  <button className={`sa-toggle ${settings.forceReset ? 'on' : 'off'}`} onClick={() => setSettings(s => ({ ...s, forceReset: !s.forceReset }))} />
                </div>
                <div style={{ display:'flex', gap:'32px', marginTop:'16px', fontSize:'14px', flexWrap:'wrap' }}>
                  <div>
                    <div style={{ color:'var(--text-light)', fontSize:'12px' }}>Session Timeout</div>
                    <select className="sa-settings-select" value={settings.sessionTimeout} onChange={e => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))}>
                      <option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>8 hours</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color:'var(--text-light)', fontSize:'12px' }}>Password Complexity</div>
                    <select className="sa-settings-select" value={settings.passwordComplexity} onChange={e => setSettings(s => ({ ...s, passwordComplexity: e.target.value }))}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color:'var(--text-light)', fontSize:'12px' }}>Max Login Attempts</div>
                    <select className="sa-settings-select" value={settings.maxLogin} onChange={e => setSettings(s => ({ ...s, maxLogin: e.target.value }))}>
                      <option>3 attempts</option><option>5 attempts</option><option>10 attempts</option>
                    </select>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-full" onClick={() => alert('All settings saved successfully!')}>
                <i className="ri-save-line" /> Save All Settings
              </button>
            </div>
          )}

          {/* ── TAB 6: AUDIT LOGS ── */}
          {activeTab === 'audit' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>Audit Logs</div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <div className="sa-table-search" style={{ margin:0 }}>
                    <i className="ri-search-line" />
                    <input type="text" placeholder="Search logs..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} />
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => alert('Logs exported!')}><i className="ri-download-line" /> Export</button>
                </div>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>IP Address</th><th>Status</th></tr></thead>
                  <tbody>
                    {filteredAudit.map((r, i) => (
                      <tr key={i}>
                        <td>{r.ts}</td>
                        <td>{r.user}</td>
                        <td>{r.role !== '—' ? <span className={`badge ${ROLE_BADGE[r.role]||''}`}>{ROLE_LABEL[r.role]||r.role}</span> : '—'}</td>
                        <td>{r.action}</td>
                        <td>{r.ip}</td>
                        <td><span className={`badge badge-${r.ok ? 'confirmed' : 'full'}`}>
                          {r.ok ? <><i className="ri-checkbox-circle-line" /> Success</> : 'Failed'}
                        </span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 7: SYSTEM HEALTH ── */}
          {activeTab === 'health' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>System Health Monitoring</div>
                <button className="btn btn-outline btn-sm" onClick={() => alert('System health data refreshed!')}><i className="ri-refresh-line" /> Refresh</button>
              </div>

              <div className="health-cards" style={{ marginBottom:'20px' }}>
                {[
                  { label:'CPU Usage',     value:'72%', pct:72, color:'var(--danger)' },
                  { label:'Memory Usage',  value:'68%', pct:68, color:'var(--warning)' },
                  { label:'Disk Usage',    value:'42%', pct:42, color:'var(--success)' },
                  { label:'Network Load',  value:'35%', pct:35, color:'var(--info)' },
                ].map((h, i) => (
                  <div className="health-card" key={i}>
                    <div className="health-label">{h.label}</div>
                    <div className="health-value" style={{ color:h.color }}>{h.value}</div>
                    <div className="health-bar"><div className="health-fill" style={{ width:`${h.pct}%`, background:h.color }} /></div>
                  </div>
                ))}
              </div>

              <div className="chart-card" style={{ marginBottom:'20px' }}>
                <h3>24-Hour Resource Monitoring</h3>
                <ChartCanvas id="healthChart" />
              </div>

              <div className="health-grid">
                <div className="card">
                  <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px' }}>Service Status</div>
                  {['Web Server','Database Server','Email Service','SMS Service','Payment Gateway','CDN Service'].map((svc, i, arr) => (
                    <div className="service-row" key={svc} style={i === arr.length - 1 ? { border:'none' } : {}}>
                      <span>{svc}</span>
                      <span className="service-ok"><i className="ri-checkbox-circle-line" /> Operational</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px' }}>Last Backup</div>
                  {[
                    ['Backup Date',      '2026-03-27 02:00'],
                    ['Backup Size',      '24.3 GB'],
                    ['Status',          <span className="service-ok"><i className="ri-checkbox-circle-line" /> Successful</span>],
                    ['Next Scheduled',  '2026-03-28 02:00'],
                    ['Total Backups',   '86 backups'],
                    ['Retention Period','30 days'],
                  ].map(([k, v], i, arr) => (
                    <div className="service-row" key={k} style={i === arr.length - 1 ? { border:'none' } : {}}>
                      <span>{k}</span><span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Create User Modal */}
      <div className={`sa-modal-overlay${modal === 'create' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="sa-modal-box">
          <div className="sa-modal-head">
            <div className="sa-modal-icon info"><i className="ri-user-add-line" /></div>
            <h3>Add New User</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <div className="sa-create-grid">
            <div>
              <label className="sa-field-label">First Name *</label>
              <input className="sa-field-input" type="text" placeholder="First name" value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="sa-field-label">Last Name *</label>
              <input className="sa-field-input" type="text" placeholder="Last name" value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <label className="sa-field-label">Email *</label>
          <input className="sa-field-input" type="email" placeholder="user@example.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          <label className="sa-field-label">Password *</label>
          <input className="sa-field-input" type="password" placeholder="Minimum 6 characters" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
          <label className="sa-field-label">Role</label>
          <select className="sa-field-select" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
            <option value="Admin">Admin</option>
            <option value="Organizer">Organizer</option>
            <option value="Attendee">Attendee</option>
            <option value="Supervisor">Super Admin</option>
          </select>
          {createErr && <div style={{ fontSize:'13px', color:'#dc2626', marginTop:'8px' }}>{createErr}</div>}
          <div className="sa-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={createUser}><i className="ri-user-add-line" /> Create User</button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <div className={`sa-modal-overlay${modal === 'delete' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="sa-modal-box">
          <div className="sa-modal-head">
            <div className="sa-modal-icon danger"><i className="ri-delete-bin-line" /></div>
            <h3>Delete User</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <p className="sa-modal-text">
            Are you sure you want to delete <strong>{deleteUser ? `${deleteUser.firstName} ${deleteUser.lastName}`.trim() || deleteUser.email : ''}</strong>? This cannot be undone.
          </p>
          <div className="sa-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}><i className="ri-delete-bin-line" /> Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

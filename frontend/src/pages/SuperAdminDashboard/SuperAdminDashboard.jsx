import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLS, saveLS } from '../../utils/storage.js';
import { fmtDate, fmtTime } from '../../utils/formatDate.js';
import { apiGetAdminStats, apiGetAuditLogs, apiGetSystemHealth, apiGetHealthHistory, apiGetReportData, apiEmailReport } from '../../services/admin.service.js';
import { apiGetAllUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, apiBulkDeleteUsers } from '../../services/user.service.js';
import { apiGetAllEvents, apiDeleteEvent } from '../../services/event.service.js';
import { apiGetRefunds } from '../../services/refund.service.js';
import { useNotifications } from '../../context/NotificationContext.jsx';
import DashboardNavbar from '../../components/layout/DashboardNavbar/DashboardNavbar.jsx';

import '../../../assets/css/1_global.css';
import '../../../assets/css/6_dashboard.css';
import './SuperAdminDashboard.css';
import { generatePDFReport, generateExcelReport } from '../../utils/reportExport.js';
import useDeviceMetrics from '../../hooks/useDeviceMetrics.js';

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



const ChartCanvas = memo(function ChartCanvas({ id, chartData, chartLabels }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    (async () => {
      try {
        const { default: Chart } = await import('chart.js/auto');
        if (!ref.current) return;
        const ctx = ref.current;
        // Destroy any existing chart on this canvas before creating a new one
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        
        const configs = {
          revenueChart: {
            type:'line',
            data:{
              labels: chartLabels || ['Oct','Nov','Dec','Jan','Feb','Mar'],
              datasets:[{ data: chartData || [45000,52000,48000,60000,55000,72000], borderColor:'#4A90D9', backgroundColor:'rgba(74,144,217,0.08)', tension:0.4, fill:true, pointBackgroundColor:'#4A90D9', pointRadius:4 }],
            },
            options:{ plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } },
          },
          categoryChart: {
            type:'bar',
            data:{
              labels: chartLabels || ['Technology','Business','Workshop','Entertainment','Sports'],
              datasets:[{ data: chartData || [0,0,0,0,0], backgroundColor:'#4A90D9', borderRadius:4 }],
            },
            options:{ plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } },
          },
          financialChart: {
            type:'bar',
            data:{
              labels: ['Oct','Nov','Dec','Jan','Feb','Mar'],
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
        if (cfg) chartRef.current = new Chart(ctx, cfg);
      } catch (err) {
        console.error('Chart.js failed to load:', err);
      }
    })();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [id, chartData, chartLabels]);
  return <canvas ref={ref} id={id} height={id === 'healthChart' ? 120 : 180} />;
});

const HealthTrendChart = memo(function HealthTrendChart({ history }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !history?.length) return;
    (async () => {
      try {
        const { default: Chart } = await import('chart.js/auto');
        if (!ref.current) return;
        const ctx = ref.current;
        // Destroy any existing chart on this canvas before creating a new one
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        
        const labels = history.map(h => {
          const d = new Date(h.ts);
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        });
        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'CPU',    data: history.map(h => h.cpuUsed),  borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.06)', tension: 0.3, pointRadius: 2, fill: true },
              { label: 'Memory', data: history.map(h => h.memUsed),  borderColor: '#4A90D9', backgroundColor: 'rgba(74,144,217,0.06)', tension: 0.3, pointRadius: 2, fill: true },
              { label: 'Disk',   data: history.map(h => h.diskUsed), borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.06)', tension: 0.3, pointRadius: 2, fill: true },
              { label: 'Load',   data: history.map(h => h.loadAvg),  borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)', tension: 0.3, pointRadius: 2, fill: true },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } },
            scales: {
              y: { beginAtZero: true, max: 100, grid: { color: '#f0f0f0' }, ticks: { callback: v => v + '%' } },
              x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
            },
          },
        });
      } catch (err) {
        console.error('HealthTrendChart: Chart.js failed:', err);
      }
    })();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [history]);
  return <canvas ref={ref} height={200} />;
});

const ClientHealthChart = memo(function ClientHealthChart({ history }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !history?.length) return;
    (async () => {
      try {
        const { default: Chart } = await import('chart.js/auto');
        if (!ref.current) return;
        const ctx = ref.current;
        // Destroy any existing chart on this canvas before creating a new one
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        
        const labels = history.map(h => {
          const d = new Date(h.ts);
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        });
        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'CPU',     data: history.map(h => h.cpu),     borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.06)', tension: 0.3, pointRadius: 0, fill: true },
              { label: 'Memory',  data: history.map(h => h.memory),  borderColor: '#4A90D9', backgroundColor: 'rgba(74,144,217,0.06)', tension: 0.3, pointRadius: 0, fill: true },
              { label: 'Battery', data: history.map(h => h.battery ?? 0), borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.06)', tension: 0.3, pointRadius: 0, fill: true },
              { label: 'Network', data: history.map(h => h.network  ?? 0), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)', tension: 0.3, pointRadius: 0, fill: true },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } },
            scales: {
              y: { beginAtZero: true, max: 100, grid: { color: '#f0f0f0' }, ticks: { callback: v => v + '%' } },
              x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 9.5 } } },
            },
          },
        });
      } catch (err) {
        console.error('ClientHealthChart: Chart.js failed:', err);
      }
    })();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [history]);
  return <canvas ref={ref} height={200} />;
});

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState('overview');
  const { socket } = useNotifications();

  // Admin stats from API
  const [adminStats, setAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Real users & events from API
  const [apiUsers, setApiUsers] = useState([]);
  const [apiAllEvents, setApiAllEvents] = useState([]);
  const [apiRefunds, setApiRefunds] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Client device metrics — only polls when Health tab is active
  const { deviceMetrics, deviceInfo, history: deviceHistory, error: deviceError } = useDeviceMetrics({
    pollInterval: 10000,
    maxHistory: 20,
    enabled: activeTab === 'health',
  });

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Server-reported system health (backend CPU/memory/disk/uptime/services)
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [lastHealthCheck, setLastHealthCheck] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGetAdminStats();
      setAdminStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    const users = await apiGetAllUsers().catch(() => []);
    setApiUsers(Array.isArray(users) ? users : []);
  }, []);

  const loadEvents = useCallback(async () => {
    const events = await apiGetAllEvents().catch(() => []);
    setApiAllEvents(Array.isArray(events) ? events : []);
  }, []);

  const loadRefunds = useCallback(async () => {
    const refunds = await apiGetRefunds().catch(() => []);
    setApiRefunds(Array.isArray(refunds) ? refunds : []);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Load real users, events, refunds for other tabs
  useEffect(() => {
    (async () => {
      try {
        const [, , , audit, health, history] = await Promise.all([
          loadUsers(),
          loadEvents(),
          loadRefunds(),
          apiGetAuditLogs().catch(() => []),
          apiGetSystemHealth().catch(() => null),
          apiGetHealthHistory(50).catch(() => []),
        ]);
        setAuditLogs(Array.isArray(audit) ? audit : []);
        setSystemHealth(health);
        setHealthHistory(Array.isArray(history) ? history : []);
        setLastHealthCheck(new Date().toISOString());
      } catch {} finally {
        setLoadingData(false);
        setLoadingHealth(false);
      }
    })();

    // Auto-refresh health every 60 seconds (fallback poll — the socket
    // listener below handles tickets/events/users/refunds in real time)
    const interval = setInterval(async () => {
      try {
        const [health, history] = await Promise.all([
          apiGetSystemHealth().catch(() => null),
          apiGetHealthHistory(50).catch(() => []),
        ]);
        if (health) setSystemHealth(health);
        if (Array.isArray(history)) setHealthHistory(history);
        setLastHealthCheck(new Date().toISOString());
      } catch {}
    }, 60000);

    return () => clearInterval(interval);
  }, [loadUsers, loadEvents, loadRefunds]);

  // ── Real-time updates ───────────────────────────────────────────────────
  // The backend emits "admin:update" (to the Supervisor/Admin socket rooms)
  // whenever a write changes data this dashboard shows — ticket registrations,
  // refunds, event approvals, user changes, etc. Refetch only the affected
  // slice instead of polling, so the Overview/Users/Events/Refunds tabs stay
  // live without a manual page reload. Add new resource names here (and on
  // the backend's broadcastAdminUpdate calls) as more views need this.
  useEffect(() => {
    if (!socket) return;
    const RESOURCE_LOADERS = {
      tickets: loadStats,
      events: loadEvents,
      users: loadUsers,
      refunds: loadRefunds,
    };
    function handleAdminUpdate({ resources = [] } = {}) {
      const loaders = new Set(resources.map(r => RESOURCE_LOADERS[r]).filter(Boolean));
      loaders.forEach(loader => loader());
    }
    socket.on('admin:update', handleAdminUpdate);
    return () => socket.off('admin:update', handleAdminUpdate);
  }, [socket, loadStats, loadEvents, loadUsers, loadRefunds]);

  // ── Lazy-load: fetch users when the Users tab becomes active ───────────
  useEffect(() => {
    // Lazy-load users when the Users tab becomes active
    if (activeTab !== 'users') return;
    if (apiUsers.length > 0) return;
    apiGetAllUsers()
      .then(data => setApiUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeTab, apiUsers.length]);

  // ── Lazy-load: fetch audit logs when the Audit tab becomes active ──────
  useEffect(() => {
    if (activeTab !== 'audit') return;
    if (auditLogs.length > 0) return;
    setLoadingAudit(true);
    apiGetAuditLogs()
      .then(data => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => [])
      .finally(() => setLoadingAudit(false));
  }, [activeTab, auditLogs.length]);



  // ── Real-time socket listeners (debounced to prevent API spam) ─────────
  // Keeps the Super Admin Dashboard live — refreshes events, users, refunds,
  // and stats when changes happen anywhere on the platform.
  const debTimers = useRef({});
  function debounceSocket(key, fn, delay = 3000) {
    if (debTimers.current[key]) return;
    debTimers.current[key] = setTimeout(() => {
      fn();
      delete debTimers.current[key];
    }, delay);
  }

  useEffect(() => {
    if (!socket) return;

    function refreshAll() {
      apiGetAllEvents()
        .then(data => setApiAllEvents(Array.isArray(data) ? data : []))
        .catch(() => {});
      apiGetAdminStats()
        .then(data => setAdminStats(data))
        .catch(() => {});
    }

    function onUserUpdate() {
      apiGetAllUsers()
        .then(data => setApiUsers(Array.isArray(data) ? data : []))
        .catch(() => {});
      apiGetAdminStats()
        .then(data => setAdminStats(data))
        .catch(() => {});
    }

    function onNotification(notification) {
      if (notification.type === 'refund_requested' || notification.type === 'refund_resolved') {
        apiGetRefunds()
          .then(data => setApiRefunds(Array.isArray(data) ? data : []))
          .catch(() => {});
        apiGetAdminStats()
          .then(data => setAdminStats(data))
          .catch(() => {});
      }
    }

    const debouncedRefresh = () => debounceSocket('event', refreshAll, 3000);
    const debouncedUser = () => debounceSocket('user', onUserUpdate, 3000);
    const debouncedNotif = (n) => debounceSocket('notif', () => onNotification(n), 3000);

    socket.on('event-update', debouncedRefresh);
    socket.on('user-update', debouncedUser);
    socket.on('notification', debouncedNotif);

    return () => {
      socket.off('event-update', debouncedRefresh);
      socket.off('user-update', debouncedUser);
      socket.off('notification', debouncedNotif);
      // Clear any pending debounce timers
      Object.values(debTimers.current).forEach(t => clearTimeout(t));
      debTimers.current = {};
    };
  }, [socket]);

  // ── Periodic auto-refresh (stats) ─────────────────────────────────────
  // Refreshes overview/financial stats every 30s as a safety net.
  useEffect(() => {
    const statsInterval = setInterval(async () => {
      try {
        const data = await apiGetAdminStats();
        if (data) setAdminStats(data);
      } catch {}
    }, 30000);
    return () => clearInterval(statsInterval);
  }, []);



  const [roleFilter,   setRoleFilter]   = useState('all');
  const [userSearch,   setUserSearch]   = useState('');
  const [eventFilter,  setEventFilter]  = useState('all');
  const [eventSearch,  setEventSearch]  = useState('');
  const [auditSearch,  setAuditSearch]  = useState('');
  const [modal,        setModal]        = useState(null); // 'create' | 'edit' | 'delete' | 'bulk-delete'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedUserEmails, setSelectedUserEmails] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const BULK_DELETE_CAP = 10;
  const [createForm,   setCreateForm]   = useState({ firstName:'', lastName:'', email:'', password:'', role:'Admin' });
  const [createErr,    setCreateErr]    = useState('');
  const [editTarget,   setEditTarget]   = useState(null); // email of user being edited
  const [editRole,     setEditRole]     = useState('Attendee');
  const [editStatus,   setEditStatus]   = useState('active');
  const [editErr,      setEditErr]      = useState('');
  const [tick,         setTick]         = useState(0);

  const [settings,     setSettings]     = useState({ emailNotif:true, smsNotif:true, pushNotif:false, autoBackup:true, twoFactor:true, forceReset:false, sessionTimeout:'30 minutes', passwordComplexity:'High', maxLogin:'3 attempts' });

  // Report generation state
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(null); // 'pdf' | 'csv' | 'email' | null
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate,   setReportEndDate]   = useState('');

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('erms_user')); } catch { return null; }
  }, [tick]);

  const allUsers = useMemo(() => {
    const ov   = loadLS(OVER_KEY, {});
    const reserved = SA_RESERVED.map(u => {
      const o = ov[u.email] || {};
      return { ...u, role: o.role || u.role, status: o.status || 'Active', deleted: !!o.deleted, src:'reserved' };
    }).filter(u => !u.deleted);
    const attendees = loadLS('erms_attendees', []).map(u => ({
      firstName: u.firstName||'', lastName: u.lastName||'', email: u.email||'',
      role: u.role||'Attendee', status: u.status||'Active',
      joined: u.joined || (Number(u.id) > 1e12 ? fmtDate(new Date(Number(u.id))) : '—'),
      src:'attendee',
    }));
    // Merge API users into the list
    const apiMapped = apiUsers.map(u => ({
      firstName: u.firstName||'', lastName: u.lastName||'', email: u.email||'',
      role: u.role||'Attendee', status: (u.status === 'suspended' ? 'Suspended' : 'Active'),
      joined: u.createdAt ? fmtDate(u.createdAt) : '—',
      src:'database',
    }));
    // Deduplicate by email: reserved > attendee > database
    const byEmail = new Map();
    [...reserved, ...attendees, ...apiMapped].forEach(u => {
      const key = u.email.toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, u);
    });
    return Array.from(byEmail.values());
  }, [tick, apiUsers]);
  const myEmail = (user?.email || '').toLowerCase();

  // Drop any selection that no longer exists once the list refreshes (e.g.
  // another admin deleted the same user in real time via admin:update).
  useEffect(() => {
    setSelectedUserEmails(prev => {
      const stillPresent = new Set(allUsers.map(u => u.email.toLowerCase()));
      const next = prev.filter(email => stillPresent.has(email.toLowerCase()));
      return next.length === prev.length ? prev : next;
    });
  }, [allUsers]);

  // ── Lazy computed data ─────────────────────────────────────────────────
  // Only compute filtered data when its tab is active to avoid unnecessary work.
  const filteredUsers = useMemo(() => {
    if (activeTab !== 'users') return allUsers;
    const q = userSearch.toLowerCase();
    return allUsers.filter(u => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      const roleOk = roleFilter === 'all' || u.role === roleFilter;
      return roleOk && (name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    });
  }, [allUsers, roleFilter, userSearch, activeTab]);

  const computedEvents = useMemo(() => {
    const ov = loadLS('erms_event_overrides', {});
    return apiAllEvents.map(e => {
      const regCount = Number(e.registered || e.attending || 0);
      const rev = regCount * Number(e.price || 0);
      const cap = Number(e.capacity) || 0;
      const st = cap > 0 && regCount >= cap ? 'Full' : 'Available';
      return {
        id: e.id,
        title: e.title,
        organizer: e.organizer ? `${e.organizer.firstName} ${e.organizer.lastName}`.trim() || '—' : '—',
        date: fmtDate(e.date) || '—',
        category: e.category || 'General',
        registered: regCount,
        capacity: cap,
        revenue: rev,
        status: st,
        image: e.image || '',
        description: e.description || '',
        published: e.published,
      };
    });
  }, [apiAllEvents]);

  const filteredEvents = useMemo(() => {
    if (activeTab !== 'events') return computedEvents;
    const q = eventSearch.toLowerCase();
    return computedEvents.filter(e => {
      const statusOk = eventFilter === 'all' || e.status === eventFilter;
      return statusOk && ((e.title || '').toLowerCase().includes(q) || (e.organizer || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    });
  }, [computedEvents, eventFilter, eventSearch, activeTab]);

  const filteredAudit = useMemo(() => {
    if (activeTab !== 'audit') return auditLogs;
    const q = auditSearch.toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(r => ((r.user || '') + (r.action || '') + (r.role || '') + (r.ip || '')).toLowerCase().includes(q));
  }, [auditLogs, auditSearch, activeTab]);

  const loadingEventsData = apiAllEvents.length === 0;

  async function toggleSuspend(email) {
    const u = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!u) return;
    const next = u.status === 'Suspended' ? 'Active' : 'Suspended';

    // For real database users, call the API
    if (u.src === 'database') {
      // Find the real API user to get their ID
      const apiUser = apiUsers.find(au => au.email.toLowerCase() === email.toLowerCase());
      if (apiUser) {
        try {
          await apiUpdateUser(apiUser.id, { status: next === 'Active' ? 'active' : 'suspended' });
          // Refresh users from API
          const refreshed = await apiGetAllUsers();
          setApiUsers(Array.isArray(refreshed) ? refreshed : []);
          return;
        } catch (err) {
          console.error('Failed to update user status:', err);
          return;
        }
      }
    }

    // Fallback: localStorage user management
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

  function openEdit(email) {
    const u = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!u) return;
    setEditTarget(email);
    setEditRole(u.role || 'Attendee');
    setEditStatus(u.status === 'Suspended' ? 'suspended' : 'active');
    setEditErr('');
    setModal('edit');
  }

  async function saveEdit() {
    if (!editTarget) { setModal(null); return; }
    const u = allUsers.find(u => u.email.toLowerCase() === editTarget.toLowerCase());
    if (!u) { setModal(null); return; }
    setEditErr('');

    // For real database users, call the API
    if (u.src === 'database') {
      const apiUser = apiUsers.find(au => au.email.toLowerCase() === editTarget.toLowerCase());
      if (apiUser) {
        try {
          await apiUpdateUser(apiUser.id, { role: editRole, status: editStatus });
          const refreshed = await apiGetAllUsers();
          setApiUsers(Array.isArray(refreshed) ? refreshed : []);
          setModal(null);
          setEditTarget(null);
        } catch (err) {
          setEditErr(err.message || 'Failed to update user.');
        }
      }
      return;
    }

    // Fallback: localStorage user management
    const statusLabel = editStatus === 'suspended' ? 'Suspended' : 'Active';
    if (u.src === 'attendee') {
      const list = loadLS('erms_attendees', []);
      const i = list.findIndex(a => (a.email||'').toLowerCase() === editTarget.toLowerCase());
      if (i !== -1) { list[i].role = editRole; list[i].status = statusLabel; saveLS('erms_attendees', list); }
    } else {
      const ov = loadLS(OVER_KEY, {});
      ov[u.email] = { ...(ov[u.email]||{}), role: editRole, status: statusLabel };
      saveLS(OVER_KEY, ov);
    }
    setModal(null);
    setEditTarget(null);
    setTick(t => t + 1);
  }

  function openDelete(email) {
    setDeleteTarget(email);
    setModal('delete');
  }

  async function confirmDelete() {
    if (!deleteTarget) { setModal(null); return; }
    const u = allUsers.find(u => u.email.toLowerCase() === deleteTarget.toLowerCase());
    if (u) {
      // For real database users, call the API
      if (u.src === 'database') {
        const apiUser = apiUsers.find(au => au.email.toLowerCase() === deleteTarget.toLowerCase());
        if (apiUser) {
          try {
            await apiDeleteUser(apiUser.id);
            const refreshed = await apiGetAllUsers();
            setApiUsers(Array.isArray(refreshed) ? refreshed : []);
          } catch (err) {
            console.error('Failed to delete user:', err);
            alert(err.message || 'Failed to delete user.');
          }
          setModal(null);
          setDeleteTarget(null);
          return;
        }
      }
      // Fallback: localStorage user management
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

  // ── Bulk delete (up to BULK_DELETE_CAP users at once) ────────────────────
  function toggleUserSelect(email, selectable) {
    if (!selectable) return;
    setSelectedUserEmails(prev => {
      if (prev.includes(email)) return prev.filter(e => e !== email);
      if (prev.length >= BULK_DELETE_CAP) return prev; // cap reached, ignore
      return [...prev, email];
    });
  }

  async function confirmBulkDelete() {
    const targets = selectedUserEmails
      .map(email => apiUsers.find(au => au.email.toLowerCase() === email.toLowerCase()))
      .filter(Boolean);
    if (targets.length === 0) { setModal(null); return; }

    setBulkDeleting(true);
    try {
      const result = await apiBulkDeleteUsers(targets.map(u => u.id));
      const refreshed = await apiGetAllUsers();
      setApiUsers(Array.isArray(refreshed) ? refreshed : []);
      setSelectedUserEmails([]);
      setModal(null);
      if (result?.blocked > 0) {
        alert(`${result.deleted} user(s) deleted. ${result.blocked} skipped because they still organize events — reassign or delete those events first.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete selected users.');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function createUser() {
    setCreateErr('');
    const { firstName, lastName, email, password, role } = createForm;
    if (!firstName || !lastName || !email || !password) { setCreateErr('Please fill in all required fields.'); return; }
    if (password.length < 6) { setCreateErr('Password must be at least 6 characters.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setCreateErr('Please enter a valid email address.'); return; }
    const lc = email.toLowerCase();
    if (allUsers.some(u => u.email.toLowerCase() === lc)) { setCreateErr('An account with this email already exists.'); return; }

    try {
      // Create via API so it reaches the Prisma database
      await apiCreateUser({ firstName, lastName, email: lc, password, role });
      const refreshed = await apiGetAllUsers();
      setApiUsers(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setCreateErr(err.message || 'Failed to create user via API.');
      return;
    }

    setCreateForm({ firstName:'', lastName:'', email:'', password:'', role:'Admin' });
    setModal(null);
  }

  const deleteUser = deleteTarget ? allUsers.find(u => u.email.toLowerCase() === deleteTarget.toLowerCase()) : null;

  // ── Report Handlers ──────────────────────────────────────────────────────
  async function fetchReportData(forceRefresh = false) {
    if (reportData && !forceRefresh) return reportData;
    setLoadingReport(true);
    try {
      const data = await apiGetReportData(
        reportStartDate || undefined,
        reportEndDate   || undefined,
      );
      setReportData(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      alert('Failed to load report data. Please try again.');
      return null;
    } finally {
      setLoadingReport(false);
    }
  }

  async function handleExportPDF() {
    if (reportGenerating) return; // guard: prevent double-click
    setReportGenerating('pdf');
    try {
      const data = await fetchReportData(true);
      if (!data) {
        console.error('fetchReportData returned null — API might have failed');
        return;
      }
      const filename = await generatePDFReport(data);
      alert(`PDF report downloaded: ${filename}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF report. Check console for details.');
    } finally {
      setReportGenerating(null);
    }
  }

  async function handleExportCSV() {
    if (reportGenerating) return; // guard: prevent double-click
    setReportGenerating('csv');
    try {
      const data = await fetchReportData(true);
      if (!data) {
        console.error('fetchReportData returned null — API might have failed');
        return;
      }
      const filename = await generateExcelReport(data);
      alert(`Excel report downloaded: ${filename}`);
    } catch (err) {
      console.error('Excel generation failed:', err);
      alert('Failed to generate Excel report. Check console for details.');
    } finally {
      setReportGenerating(null);
    }
  }

  async function handleEmailReport() {
    setReportGenerating('email');
    try {
      const email = user?.email;
      if (!email) { alert('No email found for your account.'); return; }
      await apiEmailReport(
        reportStartDate || undefined,
        reportEndDate   || undefined,
        email,
      );
      alert(`Report summary sent to ${email}`);
    } catch (err) {
      console.error('Email report failed:', err);
      alert(err.message || 'Failed to send email report. Check SMTP configuration.');
    } finally {
      setReportGenerating(null);
    }
  }

  const hasDateRange = reportStartDate || reportEndDate;

  // ── Memoized chart data (prevents unnecessary Chart.js re-initialization) ─
  const monthlyRevLabels = useMemo(
    () => adminStats?.monthlyRevenue?.map(m => m.month),
    [adminStats?.monthlyRevenue]
  );
  const monthlyRevData = useMemo(
    () => adminStats?.monthlyRevenue?.map(m => m.revenue),
    [adminStats?.monthlyRevenue]
  );
  const categoryLabels = useMemo(
    () => adminStats?.eventsByCategory?.map(c => c.category),
    [adminStats?.eventsByCategory]
  );
  const categoryData = useMemo(
    () => adminStats?.eventsByCategory?.map(c => c.count),
    [adminStats?.eventsByCategory]
  );

  // ── Memoized financial cards (extracted from IIFE) ──────────────────────
  const financialCards = useMemo(() => {
    if (!adminStats) return [];
    const totalRev = adminStats.totalRevenue || 0;
    const totalReg = adminStats.totalRegistrations || 0;
    const monthlyRev = adminStats.monthlyRevenue || [];
    const thisMonth = monthlyRev.length > 0 ? monthlyRev[monthlyRev.length - 1]?.revenue || 0 : 0;
    const avgPrice = totalReg > 0 ? Math.round(totalRev / totalReg) : 0;
    const refundCount = apiRefunds.filter(r => r.status === 'approved' || r.status === 'rejected').length;
    const netRev = totalRev;
    return [
      { label:'Total Revenue',     value:`$${totalRev.toLocaleString()}`,  trend:`${totalReg} tickets sold`, up:true },
      { label:'This Month',         value:`$${thisMonth.toLocaleString()}`, trend:`${monthlyRev.length > 1 ? ((thisMonth / (monthlyRev[monthlyRev.length - 2]?.revenue || 1) - 1) * 100).toFixed(0) : 0}% vs last month`, up:thisMonth >= (monthlyRev[monthlyRev.length - 2]?.revenue || 0) },
      { label:'Total Tickets Sold', value:totalReg.toLocaleString(),        trend:'Across all events', up:true },
      { label:'Avg. Ticket Price',  value:`$${avgPrice}`,                   trend:'Per ticket', up:true },
      { label:'Refunds',            value:`${refundCount}`,                  trend:`${apiRefunds.filter(r => r.status === 'pending').length} pending`, up:false },
      { label:'Net Revenue',        value:`$${netRev.toLocaleString()}`,     trend:'After all transactions', up:netRev >= 0 },
    ];
  }, [adminStats, apiRefunds]);

  return (
    <>
      {/* ── Navbar ── */}
      <DashboardNavbar />

      <div className="dashboard-page">

        <div className="dashboard-header">
          <div>
            <h1>System Administrator Dashboard</h1>
            <p>Complete platform control and monitoring</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center', flexShrink:0 }}>
            {user && <span style={{ fontSize:'13px', color:'var(--text-medium)', whiteSpace:'nowrap' }}>Welcome, {user.firstName} {user.lastName}</span>}
            <button type="button" className="btn btn-outline btn-sm" onClick={handleExportPDF} disabled={loadingReport || reportGenerating === 'pdf'} style={{ minWidth:140 }}>
              {reportGenerating === 'pdf' ? <><i className="ri-loader-4-line ri-spin" /> Generating...</> : <><i className="ri-file-pdf-line" /> Export PDF</>}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleExportCSV} disabled={loadingReport || reportGenerating === 'csv'} style={{ minWidth:140 }}>
              {reportGenerating === 'csv' ? <><i className="ri-loader-4-line ri-spin" /> Generating...</> : <><i className="ri-file-excel-line" /> Export Excel</>}
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
              ['reports',   'ri-file-chart-line',           'Reports'],
            ].map(([id, icon, label]) => (
              <button key={id} className={`tab-btn${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
                <i className={icon} /> {label}
              </button>
            ))}
          </div>

          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="tab-content active">
              {loadingStats ? (
                <div className="loading-spinner" style={{ textAlign:'center', padding:'60px 0', color:'var(--text-light)' }}>
                  <i className="ri-loader-4-line ri-spin" style={{ fontSize:32 }} />
                  <p style={{ marginTop:12 }}>Loading dashboard data…</p>
                </div>
              ) : (
                <>
                  <div className="stats-cards">
                    <div className="stat-card">
                      <div className="stat-card-info">
                        <div className="label">Total Users</div>
                        <div className="value">{(adminStats?.totalUsers || 0).toLocaleString()}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-light)' }}>Registered on platform</div>
                      </div>
                      <div className="stat-card-icon"><i className="ri-group-line" /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-info">
                        <div className="label">Total Events</div>
                        <div className="value">{(adminStats?.totalEvents || 0).toLocaleString()}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-light)' }}>All events created</div>
                      </div>
                      <div className="stat-card-icon"><i className="ri-calendar-event-line" /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-info">
                        <div className="label">Total Revenue</div>
                        <div className="value">${(adminStats?.totalRevenue || 0).toLocaleString()}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-light)' }}>From successful ticket sales</div>
                      </div>
                      <div className="stat-card-icon"><i className="ri-money-dollar-circle-line" /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-info">
                        <div className="label">Registrations</div>
                        <div className="value">{(adminStats?.totalRegistrations || 0).toLocaleString()}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-light)' }}>Confirmed ticket purchases</div>
                      </div>
                      <div className="stat-card-icon"><i className="ri-ticket-2-line" /></div>
                    </div>
                  </div>

                  <div className="chart-pair">
                    <div className="chart-card chart-card-equal">
                      <h3>Monthly Revenue</h3>
                      <div className="chart-wrap">
                        <ChartCanvas
                          id="revenueChart"
                          chartLabels={monthlyRevLabels}
                          chartData={monthlyRevData}
                        />
                      </div>
                    </div>
                    <div className="chart-card chart-card-equal">
                      <h3>Events by Category</h3>
                      <div className="chart-wrap">
                        <ChartCanvas
                          id="categoryChart"
                          chartLabels={categoryLabels}
                          chartData={categoryData}
                        />
                      </div>
                    </div>
                  </div><div className="card" style={{ padding:'20px', width:'100%' }}>
                    <div className="sa-section-header">
                        <div className="section-title" style={{ margin:0 }}>Recent Registrations</div>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table className="data-table">
                        <thead><tr><th>Attendee</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                          {(adminStats?.recentRegistrations || []).length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign:'center', padding:'26px', color:'var(--text-light)' }}>No registrations yet.</td></tr>
                          ) : (adminStats?.recentRegistrations || []).map((r, i) => {
                            const initial = (r.name || '?').charAt(0).toUpperCase();
                            const bgClass = ['badge-role-admin','badge-role-organizer','badge-role-attendee','badge-role-supervisor'][i % 4];
                            return (
                              <tr key={i}>
                                <td><div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                  <div className={`avatar-circle ${bgClass}`}>{initial}</div>{r.name}
                                </div></td>
                                <td>{r.event}</td>
                                <td>{r.date}</td>
                                <td>${Number(r.amount || 0).toLocaleString()}</td>
                                <td><span className={`badge badge-${r.status}`}>
                                  <i className={r.status === 'confirmed' ? 'ri-checkbox-circle-line' : r.status === 'pending' ? 'ri-time-line' : 'ri-close-circle-line'} /> {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                </span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 2: ALL USERS ── */}
          {activeTab === 'users' && (
            <div className="tab-content active">
              {loadingData && allUsers.length === 0 ? (
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                      {[1,2,3,4].map(i => (
                        <tr key={i}>
                          {[1,2,3,4,5,6].map(j => (
                            <td key={j}>
                              <div style={{ background:'var(--border)', height:16, width:j===1?'70%':j===2?'60%':j===3?'45%':j===4?'35%':j===5?'40%':'30%', borderRadius:4, margin:'4px 0' }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <div className="sa-section-header">
                    <div className="section-title" style={{ margin:0 }}>
                      All Users &nbsp;<span style={{ fontSize:'13px', color:'var(--text-light)', fontWeight:400 }}>{allUsers.length} total</span>
                    </div>
                    <div style={{ display:'flex', gap:'10px' }}>
                      {selectedUserEmails.length > 0 && (
                        <button className="btn btn-danger btn-sm" onClick={() => setModal('bulk-delete')}>
                          <i className="ri-delete-bin-line" /> Delete Selected ({selectedUserEmails.length})
                        </button>
                      )}
                      <button className="btn btn-primary btn-sm" onClick={() => { setCreateErr(''); setModal('create'); }}>
                        <i className="ri-user-add-line" /> Add User
                      </button>
                    </div>
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

                  {selectedUserEmails.length > 0 && (
                    <div style={{ fontSize:'12px', color:'var(--text-light)', margin:'0 0 10px' }}>
                      {selectedUserEmails.length}/{BULK_DELETE_CAP} selected — max {BULK_DELETE_CAP} users per bulk delete.
                    </div>
                  )}

                  <div style={{ overflowX:'auto' }}>
                    <table className="data-table">
                      <thead><tr><th style={{ width:36 }}></th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={7} style={{ textAlign:'center', padding:'26px', color:'var(--text-light)' }}>No users match this filter.</td></tr>
                        ) : filteredUsers.map((u, i) => {
                          const [bg, fg] = AVATAR_CLR[u.role] || ['#e2e8f0','#475569'];
                          const isSelf = u.email.toLowerCase() === myEmail;
                          const isSA   = u.role === 'Supervisor';
                          const name   = `${u.firstName} ${u.lastName}`.trim() || u.email;
                          const init   = (u.firstName || u.email || '?').charAt(0).toUpperCase();
                          const selectable = u.src === 'database' && !isSelf && !isSA;
                          const isChecked  = selectedUserEmails.includes(u.email);
                          const capReached = !isChecked && selectedUserEmails.length >= BULK_DELETE_CAP;
                          return (
                            <tr key={i} className={u.status === 'Suspended' ? 'sa-muted-row' : ''}>
                              <td>
                                {selectable && (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={capReached}
                                    title={capReached ? `You can only select up to ${BULK_DELETE_CAP} users at a time.` : ''}
                                    onChange={() => toggleUserSelect(u.email, selectable)}
                                  />
                                )}
                              </td>
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
                                      <button className="btn btn-outline btn-sm" title="Edit Role / Status" onClick={() => openEdit(u.email)}>
                                        <i className="ri-edit-line" />
                                      </button>
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
                </>
              )}
            </div>
          )}

          {/* ── TAB 3: ALL EVENTS ── */}
          {activeTab === 'events' && (
            <div className="tab-content active">
              {loadingEventsData ? (
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Event Title</th><th>Organizer</th><th>Date</th><th>Category</th><th>Registered</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {[1,2,3,4].map(i => (
                        <tr key={i}>
                          {[1,2,3,4,5,6,7,8].map(j => (
                            <td key={j}>
                              <div style={{ background:'var(--border)', height:16, width:j===1?'70%':j===2?'50%':j===3?'45%':j===4?'40%':j===5?'35%':j===6?'30%':j===7?'30%':'30%', borderRadius:4, margin:'4px 0' }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
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
                        {filteredEvents.length === 0 ? (
                          <tr><td colSpan={8} style={{ textAlign:'center', padding:'26px', color:'var(--text-light)' }}>No events found.</td></tr>
                        ) : filteredEvents.map((e, i) => (
                          <tr key={e.id || i}>
                            <td style={{ fontWeight:500 }}>{e.title}</td>
                            <td>{e.organizer}</td>
                            <td>{e.date}</td>
                            <td>{e.category}</td>
                            <td>{e.registered.toLocaleString()}{e.capacity ? ` / ${e.capacity.toLocaleString()}` : ''}</td>
                            <td style={{ color:'var(--success)', fontWeight:600 }}>${e.revenue.toLocaleString()}</td>
                            <td><span className={`badge badge-${e.status === 'Full' ? 'full' : 'available'}`}>{e.status}</span></td>
                            <td>
                              <div className="action-btns">
                                <button className="btn btn-outline btn-sm" title="View" onClick={() => {
                                  localStorage.setItem('erms_selected_event', JSON.stringify(e));
                                  window.open(`/events/${e.id}`, '_blank');
                                }}><i className="ri-eye-line" /></button>
                                <button className="btn btn-outline btn-sm" title="Edit" onClick={() => {
                                  localStorage.setItem('erms_edit_event', JSON.stringify(e));
                                  navigate('/create-event');
                                }}><i className="ri-edit-line" /></button>
                                <button className="btn btn-danger btn-sm" title="Delete" onClick={async () => {
                                  if (!window.confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
                                  try {
                                    await apiDeleteEvent(e.id);
                                    const refreshed = await apiGetAllEvents();
                                    setApiAllEvents(Array.isArray(refreshed) ? refreshed : []);
                                    window.dispatchEvent(new CustomEvent('erms:events-updated'));
                                  } catch (err) {
                                    alert('Failed to delete event: ' + (err.message || 'Unknown error'));
                                  }
                                }}><i className="ri-delete-bin-line" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 4: FINANCIAL ── */}
          {activeTab === 'financial' && (
            <div className="tab-content active">
              {loadingData && !adminStats ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-light)' }}>
                  <i className="ri-loader-4-line ri-spin" style={{ fontSize:32 }} />
                  <p style={{ marginTop:12 }}>Loading financial data…</p>
                </div>
              ) : (
                <>
                  <div className="sa-section-header">
                    <div className="section-title" style={{ margin:0 }}>Financial Reports</div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleExportCSV} disabled={reportGenerating === 'csv'}>
                      {reportGenerating === 'csv' ? <><i className="ri-loader-4-line ri-spin" /> Generating...</> : <><i className="ri-file-excel-line" /> Export Excel</>}
                    </button>
                  </div>

                  <div className="financial-cards">
                    {financialCards.map((c, i) => (
                      <div className="financial-card" key={i}>
                        <div className="f-label">{c.label}</div>
                        <div className="f-value">{c.value}</div>
                        <div className={c.up ? 'f-trend' : 'f-down'}>
                          <i className={`ri-arrow-${c.up ? 'up' : 'down'}-line`} /> {c.trend}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="chart-card" style={{ marginBottom:'20px' }}>
                    <h3>Monthly Revenue Breakdown</h3>
                    <ChartCanvas
                      id="financialChart"
                      chartLabels={monthlyRevLabels}
                      chartData={monthlyRevData}
                    />
                  </div>

                  <div className="section-title">Revenue by Event</div>
                  <div style={{ overflowX:'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>Event</th><th>Category</th><th>Tickets Sold</th><th>Ticket Price</th><th>Gross Revenue</th></tr></thead>
                      <tbody>
                        {computedEvents.length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign:'center', padding:'26px', color:'var(--text-light)' }}>No events yet.</td></tr>
                        ) : computedEvents.map((e, i) => (
                          <tr key={e.id || i}>
                            <td>{e.title}</td><td>{e.category}</td><td>{e.registered.toLocaleString()}</td>
                            <td>${Number(e.registered > 0 ? (e.revenue / e.registered) : (apiAllEvents.find(a => a.id === e.id)?.price || 0)).toLocaleString()}</td>
                            <td style={{ color:'var(--success)', fontWeight:600 }}>${e.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
              {loadingAudit ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-light)' }}>
                  <i className="ri-loader-4-line ri-spin" style={{ fontSize:32 }} />
                  <p style={{ marginTop:12 }}>Loading audit logs…</p>
                </div>
              ) : (
                <>
                  <div className="sa-section-header">
                    <div className="section-title" style={{ margin:0 }}>Audit Logs</div>
                    <div style={{ display:'flex', gap:'10px' }}>
                      <div className="sa-table-search" style={{ margin:0 }}>
                        <i className="ri-search-line" />
                        <input type="text" placeholder="Search logs..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} />
                      </div>
                          <button type="button" className="btn btn-outline btn-sm" onClick={handleExportCSV} disabled={reportGenerating === 'csv'}>
                      {reportGenerating === 'csv' ? <><i className="ri-loader-4-line ri-spin" /> Generating...</> : <><i className="ri-download-line" /> Export</>}
                    </button>
                    </div>
                  </div>

                  <div style={{ overflowX:'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Status</th></tr></thead>
                      <tbody>
                        {filteredAudit.length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign:'center', padding:'26px', color:'var(--text-light)' }}>No audit logs found.</td></tr>
                        ) : filteredAudit.map((r, i) => (
                          <tr key={i}>
                            <td style={{ whiteSpace:'nowrap' }}>{r.ts}</td>
                            <td>{r.user}</td>
                            <td>{r.role !== '—' ? <span className={`badge ${ROLE_BADGE[r.role]||''}`}>{ROLE_LABEL[r.role]||r.role}</span> : '—'}</td>
                            <td>{r.action}</td>
                            <td><span className={`badge badge-${r.ok ? 'confirmed' : 'full'}`}>
                              {r.ok ? <><i className="ri-checkbox-circle-line" /> Success</> : 'Failed'}
                            </span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 7: DEVICE HEALTH (real-time client-side metrics) ── */}
          {activeTab === 'health' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>
                  <i className="ri-smartphone-line" style={{ marginRight:8 }} /> Device Health Monitoring
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'12px', color:'var(--text-light)' }}>
                    <i className="ri-time-line" /> Live — {deviceHistory.length} snapshots
                  </span>
                  <span style={{ fontSize:'11px', background:'var(--bg-secondary,#f1f5f9)', padding:'4px 10px', borderRadius:'6px', color:'var(--text-medium)' }}>
                    <i className="ri-refresh-line" /> Every 2s
                  </span>
                  {deviceError && (
                    <span style={{ fontSize:'11px', color:'var(--danger)' }}>
                      <i className="ri-error-warning-line" /> {deviceError}
                    </span>
                  )}
                </div>
              </div>

              <div className="health-cards" style={{ marginBottom:'20px' }}>
                {(() => {
                  const cpuPct = deviceMetrics.cpu;
                  const memPct = deviceMetrics.memory;
                  const batPct = deviceMetrics.battery;
                  const netSpeed = deviceMetrics.networkSpeed;

                  // Network display
                  const netLabel = deviceMetrics.network === 'unknown'
                    ? (navigator.onLine ? 'Connected' : 'Offline')
                    : `${deviceMetrics.network.toUpperCase()} · ${netSpeed} Mbps`;

                  return [
                    {
                      icon:'ri-cpu-line',
                      label:'CPU Usage',
                      value: `${cpuPct}%`,
                      pct: cpuPct,
                      sub: `${deviceInfo.cores} cores`,
                      color: cpuPct > 70 ? 'var(--danger)' : cpuPct > 40 ? 'var(--warning)' : 'var(--success)',
                    },
                    {
                      icon:'ri-ram-line',
                      label:'Memory (JS Heap)',
                      value: memPct > 0 ? `${memPct}%` : deviceMetrics.memoryTotal > 0 ? `${(deviceMetrics.memoryTotal / 1073741824).toFixed(1)} GB` : 'N/A',
                      pct: memPct || 0,
                      sub: deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory} GB device` : '—',
                      color: memPct > 70 ? 'var(--danger)' : memPct > 40 ? 'var(--warning)' : 'var(--info)',
                    },
                    {
                      icon:'ri-battery-2-line',
                      label:'Battery',
                      value: batPct !== null ? `${batPct}%` : 'N/A',
                      pct: batPct !== null ? batPct : 0,
                      sub: batPct !== null
                        ? (deviceMetrics.batteryCharging ? '⚡ Charging' : `${batPct}% remaining`)
                        : 'Not available',
                      color: batPct !== null
                        ? (batPct < 20 ? 'var(--danger)' : batPct < 40 ? 'var(--warning)' : 'var(--success)')
                        : 'var(--text-light)',
                    },
                    {
                      icon:'ri-wifi-line',
                      label:'Network',
                      value: netLabel,
                      pct: netSpeed > 0 ? Math.min(100, Math.round((netSpeed / 10) * 100)) : 0,
                      sub: navigator.onLine ? 'Online' : 'Offline',
                      color: navigator.onLine ? 'var(--success)' : 'var(--danger)',
                    },
                  ].map((h, i) => (
                    <div className="health-card" key={i}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                        <i className={h.icon} style={{ fontSize:'16px', color:h.color }} />
                        <div className="health-label" style={{ margin:0 }}>{h.label}</div>
                      </div>
                      <div className="health-value" style={{ color:h.color, fontSize: h.label === 'Network' ? '16px' : '22px' }}>{h.value}</div>
                      {h.label !== 'Network' && (
                        <div className="health-bar" style={{ marginBottom:4 }}>
                          <div className="health-fill" style={{ width:`${h.pct}%`, background:h.color }} />
                        </div>
                      )}
                      <div style={{ fontSize:'11px', color:'var(--text-light)' }}>{h.sub}</div>
                    </div>
                  ));
                })()}
              </div>

              {/* Storage usage card */}
              {deviceMetrics.storage !== null && (
                <div className="card" style={{ padding:'16px 20px', marginBottom:'20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                    <i className="ri-database-2-line" style={{ color:'var(--primary)', fontSize:'16px' }} />
                    <span style={{ fontSize:'14px', fontWeight:600 }}>Browser Storage Usage</span>
                    <span style={{ fontSize:'12px', color:'var(--text-light)', marginLeft:'auto' }}>
                      {deviceMetrics.storage}% used
                    </span>
                  </div>
                  <div className="health-bar" style={{ height:6 }}>
                    <div className="health-fill" style={{
                      width:`${deviceMetrics.storage}%`,
                      background: deviceMetrics.storage > 80 ? 'var(--danger)' : deviceMetrics.storage > 50 ? 'var(--warning)' : 'var(--info)',
                    }} />
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--text-light)', marginTop:'6px' }}>
                    {deviceMetrics.storageUsage > 0
                      ? `${(deviceMetrics.storageUsage / 1073741824).toFixed(1)} GB of ${(deviceMetrics.storageQuota / 1073741824).toFixed(1)} GB`
                      : 'Storage estimate not available'}
                  </div>
                </div>
              )}

              {/* Historical trend chart */}
              {deviceHistory.length > 2 && (
                <div className="chart-card" style={{ marginBottom:'20px' }}>
                  <h3>Device Metrics Over Time ({deviceHistory.length} snapshots)</h3>
                  <ClientHealthChart history={deviceHistory} />
                </div>
              )}

              <div className="health-grid">
                <div className="card">
                  <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <i className="ri-computer-line" style={{ color:'var(--primary)' }} /> Device Information
                  </div>
                  {[
                    ['Operating System', deviceInfo.os],
                    ['Browser',          deviceInfo.browser],
                    ['CPU Cores',        deviceInfo.cores > 0 ? `${deviceInfo.cores} cores` : '—'],
                    ['Device Memory',    deviceInfo.deviceMemory > 0 ? `${deviceInfo.deviceMemory} GB` : '—'],
                    ['Screen',           deviceInfo.screen],
                    ['Platform',         deviceInfo.platform],
                  ].map(([k, v], i, arr) => (
                    <div className="service-row" key={k} style={i === arr.length - 1 ? { border:'none' } : {}}>
                      <span>{k}</span>
                      <span style={{ fontWeight:500, color:'var(--text-dark)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <i className="ri-signal-wifi-line" style={{ color:'var(--success)' }} /> Network & Status
                  </div>
                  {[
                    ['Online Status', navigator.onLine
                      ? <span style={{ color:'var(--success)' }}><i className="ri-checkbox-circle-line" /> Online</span>
                      : <span style={{ color:'var(--danger)' }}><i className="ri-close-circle-line" /> Offline</span>],
                    ['Connection Type', deviceMetrics.network !== 'unknown' ? deviceMetrics.network.toUpperCase() : '—'],
                    ['Downlink Speed', deviceMetrics.networkSpeed > 0 ? `${deviceMetrics.networkSpeed} Mbps` : '—'],
                    ['Battery Level', deviceMetrics.battery !== null ? `${deviceMetrics.battery}%` : '—'],
                    ['Charging', deviceMetrics.batteryCharging ? 'Yes ⚡' : 'No'],
                    ['Snapshots Collected', `${deviceHistory.length} records`],
                  ].map(([k, v], i, arr) => (
                    <div className="service-row" key={k} style={i === arr.length - 1 ? { border:'none' } : {}}>
                      <span>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize:'11px', color:'var(--text-light)', textAlign:'center', marginTop:'20px' }}>
                <i className="ri-refresh-line" /> Updates every 2 seconds · tracks <strong>this device</strong>
              </div>
            </div>
          )}

          {/* ── TAB 8: REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="tab-content active">
              <div className="sa-section-header">
                <div className="section-title" style={{ margin:0 }}>System Reports</div>
              </div>

              {/* Date Range Filter */}
              <div className="report-date-filter">
                <div className="report-date-filter-label">
                  <i className="ri-calendar-line" /> Date Range Filter
                </div>
                <div className="report-date-filter-row">
                  <div className="report-date-field">
                    <label>From</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={e => setReportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="report-date-field">
                    <label>To</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={e => setReportEndDate(e.target.value)}
                    />
                  </div>
                  {hasDateRange && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { setReportStartDate(''); setReportEndDate(''); setReportData(null); }}
                    >
                      <i className="ri-close-line" /> Clear Filter
                    </button>
                  )}
                </div>
                {hasDateRange && (
                  <div className="report-date-range-info">
                    <i className="ri-information-line" /> Report will include data from{' '}
                    <strong>{reportStartDate || 'all time'}</strong> to{' '}
                    <strong>{reportEndDate || 'now'}</strong>. Click a button below to generate.
                  </div>
                )}
                {!hasDateRange && (
                  <div className="report-date-range-info">
                    <i className="ri-information-line" /> No date filter — report will include <strong>all data</strong>.
                  </div>
                )}
              </div>

              {/* Loading Skeleton */}
              {loadingReport && !reportData && (
                <div className="report-cards">
                  {[1, 2, 3].map(i => (
                    <div className="report-card" key={i} style={{ opacity:0.6 }}>
                      <div className="skeleton-img" style={{ width:56, height:56, borderRadius:14, marginBottom:16 }} />
                      <div className="skeleton-line" style={{ width:'60%', height:18, marginBottom:8 }} />
                      <div className="skeleton-line" style={{ width:'100%', marginBottom:4 }} />
                      <div className="skeleton-line" style={{ width:'90%', marginBottom:4 }} />
                      <div className="skeleton-line" style={{ width:'80%', marginBottom:16 }} />
                      {[1, 2, 3, 4, 5].map(j => (
                        <div className="skeleton-line" key={j} style={{ width: j % 2 === 0 ? '75%' : '85%', height:12, marginBottom:6 }} />
                      ))}
                      <div className="skeleton-line" style={{ width:'100%', height:40, borderRadius:8, marginTop:16 }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Report generation cards */}
              <div className="report-cards">
                {/* PDF Report Card */}
                <div className="report-card">
                  <div className="report-card-icon pdf">
                    <i className="ri-file-pdf-2-line" />
                  </div>
                  <h3>PDF Report</h3>
                  <p>Generate a comprehensive PDF report with executive summary, analytics charts (revenue, categories, users, registrations), and detailed data tables for all users, events, tickets, refunds, and testimonials.</p>
                  <div className="report-card-features">
                    <span><i className="ri-check-line" /> Executive Summary</span>
                    <span><i className="ri-check-line" /> Revenue & Category Charts</span>
                    <span><i className="ri-check-line" /> User & Role Distribution</span>
                    <span><i className="ri-check-line" /> Registration Trends</span>
                    <span><i className="ri-check-line" /> Detailed Data Tables</span>
                  </div>
                  <button type="button"
                    className="btn btn-primary btn-full"
                    onClick={handleExportPDF}
                    disabled={loadingReport || reportGenerating === 'pdf'}
                  >
                    {reportGenerating === 'pdf' ? (
                      <><i className="ri-loader-4-line ri-spin" /> Generating PDF...</>
                    ) : (
                      <><i className="ri-file-pdf-2-line" /> Download PDF Report</>
                    )}
                  </button>
                </div>

                {/* CSV Report Card */}
                <div className="report-card">
                  <div className="report-card-icon csv">
                    <i className="ri-file-excel-2-line" />
                  </div>
                  <h3>CSV Data Export</h3>
                  <p>Export all system data as a structured CSV file. Includes separate sheets for users, events, tickets, refunds, testimonials, monthly revenue, category breakdown, and role distribution.</p>
                  <div className="report-card-features">
                    <span><i className="ri-check-line" /> All Users Data</span>
                    <span><i className="ri-check-line" /> All Events & Revenue</span>
                    <span><i className="ri-check-line" /> All Tickets & Purchases</span>
                    <span><i className="ri-check-line" /> Refunds & Testimonials</span>
                    <span><i className="ri-check-line" /> Monthly Analytics</span>
                  </div>
                  <button type="button"
                    className="btn btn-success btn-full"
                    onClick={handleExportCSV}
                    disabled={loadingReport || reportGenerating === 'csv'}
                  >
                    {reportGenerating === 'csv' ? (
                      <><i className="ri-loader-4-line ri-spin" /> Generating CSV...</>
                    ) : (
                      <><i className="ri-file-excel-2-line" /> Download CSV Data</>
                    )}
                  </button>
                </div>

                {/* Email Report Card */}
                <div className="report-card">
                  <div className="report-card-icon email">
                    <i className="ri-mail-send-line" />
                  </div>
                  <h3>Email Report</h3>
                  <p>Send a comprehensive report summary directly to your email address. The email includes an executive summary with all key metrics, revenue, tickets, refunds, and testimonials overview.</p>
                  <div className="report-card-features">
                    <span><i className="ri-check-line" /> Executive Summary</span>
                    <span><i className="ri-check-line" /> Key Metrics Overview</span>
                    <span><i className="ri-check-line" /> Revenue & Ticket Stats</span>
                    <span><i className="ri-check-line" /> Sent to Your Email</span>
                    <span><i className="ri-check-line" /> Respects Date Filter</span>
                  </div>                    <button type="button"
                      className="btn btn-primary btn-full"
                      onClick={handleEmailReport}
                      disabled={loadingReport || reportGenerating === 'email'}
                    >
                    {reportGenerating === 'email' ? (
                      <><i className="ri-loader-4-line ri-spin" /> Sending Email...</>
                    ) : (
                      <><i className="ri-mail-send-line" /> Email Report to Me</>
                    )}
                  </button>
                  {user?.email && (
                    <div style={{ fontSize:'11px', color:'var(--text-light)', textAlign:'center', marginTop:'8px' }}>
                      Will be sent to: {user.email}
                    </div>
                  )}
                </div>
                  </div> {/* end report-card */}
              {/* Report preview / status */}
              {reportData && (
                <div className="card" style={{ marginTop:'20px', padding:'20px' }}>
                  <div className="section-title" style={{ marginBottom:'12px' }}>Last Report Data Summary</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' }}>
                    {[
                      { label:'Users', value:reportData.summary?.totalUsers, icon:'ri-group-line' },
                      { label:'Events', value:reportData.summary?.totalEvents, icon:'ri-calendar-event-line' },
                      { label:'Tickets', value:reportData.summary?.totalTickets, icon:'ri-ticket-2-line' },
                      { label:'Revenue', value:`$${(reportData.summary?.totalRevenue || 0).toLocaleString()}`, icon:'ri-money-dollar-circle-line' },
                      { label:'Refunds', value:reportData.summary?.approvedRefunds, icon:'ri-refund-line' },
                      { label:'Testimonials', value:reportData.testimonials?.length || 0, icon:'ri-star-line' },
                    ].map((item, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px', background:'var(--bg-secondary, #f8fafc)', borderRadius:'8px' }}>
                        <i className={item.icon} style={{ fontSize:'20px', color:'var(--primary)' }} />
                        <div>
                          <div style={{ fontSize:'12px', color:'var(--text-light)' }}>{item.label}</div>
                          <div style={{ fontSize:'18px', fontWeight:700, color:'var(--text-dark)' }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:'12px', color:'var(--text-light)', marginTop:'12px' }}>
                    Data cached. Reports will use this data until you refresh the page.
                  </div>
                </div>
              )}

              {!reportData && !loadingReport && (
                <div className="card" style={{ marginTop:'20px', padding:'40px', textAlign:'center', color:'var(--text-light)' }}>
                  <i className="ri-file-chart-line" style={{ fontSize:48, display:'block', marginBottom:'12px', opacity:0.4 }} />
                  <p>Click a button above to generate your first report. Data will be fetched from the server and cached.</p>
                </div>
              )}
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

      {/* Edit User Modal */}
      <div className={`sa-modal-overlay${modal === 'edit' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="sa-modal-box">
          <div className="sa-modal-head">
            <div className="sa-modal-icon info"><i className="ri-edit-line" /></div>
            <h3>Edit User</h3>
            <button className="m-close" onClick={() => setModal(null)}>&times;</button>
          </div>
          <p className="sa-modal-text" style={{ marginBottom: 4 }}>
            Editing <strong>{editTarget || ''}</strong>
          </p>
          <label className="sa-field-label">Role</label>
          <select className="sa-field-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
            <option value="Attendee">Attendee</option>
            <option value="Organizer">Organizer</option>
            <option value="Admin">Admin</option>
            <option value="Supervisor">Super Admin</option>
          </select>
          <label className="sa-field-label">Status</label>
          <select className="sa-field-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          {editErr && <div style={{ fontSize:'13px', color:'#dc2626', marginTop:'8px' }}>{editErr}</div>}
          <div className="sa-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}><i className="ri-save-line" /> Save Changes</button>
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
            Are you sure you want to permanently delete <strong>{deleteUser ? `${deleteUser.firstName} ${deleteUser.lastName}`.trim() || deleteUser.email : ''}</strong>? Their tickets, refunds, testimonials, bookmarks and login history will be erased too. This cannot be undone.
          </p>
          <div className="sa-modal-actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}><i className="ri-delete-bin-line" /> Delete</button>
          </div>
        </div>
      </div>

      <div className={`sa-modal-overlay${modal === 'bulk-delete' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget && !bulkDeleting) setModal(null); }}>
        <div className="sa-modal-box">
          <div className="sa-modal-head">
            <div className="sa-modal-icon danger"><i className="ri-delete-bin-line" /></div>
            <h3>Delete {selectedUserEmails.length} Users</h3>
            <button className="m-close" onClick={() => !bulkDeleting && setModal(null)}>&times;</button>
          </div>
          <p className="sa-modal-text">
            Are you sure you want to permanently delete these {selectedUserEmails.length} accounts? Each user's tickets, refunds, testimonials, bookmarks and login history will be erased too. This cannot be undone. Anyone who still organizes events will be skipped — reassign or delete their events first.
          </p>
          <ul style={{ maxHeight:160, overflowY:'auto', margin:'0 0 16px', padding:0, listStyle:'none', border:'1px solid var(--border)', borderRadius:8 }}>
            {selectedUserEmails.map(email => {
              const u = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
              return (
                <li key={email} style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  {u ? (`${u.firstName} ${u.lastName}`.trim() || u.email) : email}
                </li>
              );
            })}
          </ul>
          <div className="sa-modal-actions">
            <button className="btn btn-outline" disabled={bulkDeleting} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" disabled={bulkDeleting} onClick={confirmBulkDelete}>
              {bulkDeleting ? <><i className="ri-loader-4-line ri-spin" /> Deleting...</> : <><i className="ri-delete-bin-line" /> Delete {selectedUserEmails.length} Users</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

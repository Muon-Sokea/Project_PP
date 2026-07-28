import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetEvents } from '../../services/event.service.js';
import { apiGetMyRegistrations } from '../../services/registration.service.js';
import { apiRequestRefund } from '../../services/refund.service.js';
import { apiSubmitTestimonial, apiGetTestimonials } from '../../services/testimonial.service.js';
import { apiGetNotificationPrefs, apiSaveNotificationPrefs } from '../../services/notification.service.js';
import { apiGetBookmarks, apiUnbookmarkEvent } from '../../services/bookmark.service.js';
import { fmtDate } from '../../utils/formatDate.js';
import { useEscapeKey } from '../../hooks/useEscapeKey.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import DashboardNavbar from '../../components/layout/DashboardNavbar/DashboardNavbar.jsx';
import '../../../assets/css/1_global.css';
import '../../../assets/css/6_dashboard.css';
import './AttendeeDashboard.css';

const PROFILE_ILLUSTRATIONS = [
  ['#f5c6a5', '#2f2f35', '#f97316', 'short'],
  ['#8d5524', '#111827', '#8b5cf6', 'curly'],
  ['#ddb892', '#7c2d12', '#22c55e', 'long'],
  ['#c68642', '#3f2a1d', '#3b82f6', 'bun'],
  ['#ffdbac', '#111827', '#a16207', 'bob'],
  ['#a47148', '#4b5563', '#14b8a6', 'ponytail'],
  ['#e0ac69', '#92400e', '#ec4899', 'waves'],
  ['#6f4e37', '#18181b', '#6366f1', 'fade'],
  ['#f1c27d', '#78350f', '#84cc16', 'side'],
  ['#b78565', '#1f2937', '#06b6d4', 'cap'],
  ['#ffd7b5', '#6b21a8', '#ef4444', 'pixie'],
  ['#9c6644', '#292524', '#10b981', 'locks'],
  ['#d4a373', '#020617', '#f59e0b', 'mop'],
  ['#7f5539', '#422006', '#2563eb', 'bun2'],
  ['#f2cc8f', '#334155', '#9333ea', 'long2'],
];

const HAIR_SHAPES = {
  short:    (c) => `<path d="M22 35c2-17 36-19 40 0v12H22z" fill="${c}"/>`,
  curly:    (c) => `<g fill="${c}"><circle cx="25" cy="34" r="9"/><circle cx="35" cy="25" r="10"/><circle cx="47" cy="25" r="10"/><circle cx="57" cy="35" r="9"/><path d="M23 38h38v12H23z"/></g>`,
  long:     (c) => `<path d="M19 35c0-20 44-23 50 0 2 12-4 26-8 34H26c-5-10-8-22-7-34z" fill="${c}"/>`,
  bun:      (c) => `<g fill="${c}"><circle cx="44" cy="21" r="11"/><path d="M22 36c4-18 39-18 44 0v14H22z"/></g>`,
  bob:      (c) => `<path d="M21 35c2-21 44-21 46 0v26H21z" fill="${c}"/>`,
  ponytail: (c) => `<g fill="${c}"><path d="M22 36c2-18 39-20 43 0v13H22z"/><path d="M61 36c13 7 9 24-2 29 4-12 2-20-4-25z"/></g>`,
  waves:    (c) => `<path d="M20 37c5-25 44-20 48 0 1 8-3 15-8 20-1-10-6-17-16-17s-17 7-20 17c-4-6-6-12-4-20z" fill="${c}"/>`,
  fade:     (c) => `<path d="M23 35c3-16 39-18 42 0v10H23z" fill="${c}"/>`,
  side:     (c) => `<path d="M20 39c1-22 42-25 49-1-13-4-25-4-47 8z" fill="${c}"/>`,
  cap:      (c) => `<g><path d="M20 37c5-18 42-18 48 0H20z" fill="${c}"/><path d="M18 38h34c-6 7-22 8-34 4z" fill="#111827"/></g>`,
  pixie:    (c) => `<path d="M22 35c7-18 34-18 43 0-14-3-25 1-41 10z" fill="${c}"/>`,
  locks:    (c) => `<g fill="${c}"><path d="M22 33c3-18 40-19 44 1v20H22z"/><circle cx="23" cy="46" r="5"/><circle cx="65" cy="46" r="5"/></g>`,
  mop:      (c) => `<g fill="${c}"><circle cx="28" cy="33" r="8"/><circle cx="38" cy="27" r="9"/><circle cx="50" cy="28" r="9"/><circle cx="60" cy="35" r="8"/></g>`,
  bun2:     (c) => `<g fill="${c}"><circle cx="29" cy="31" r="8"/><circle cx="59" cy="31" r="8"/><path d="M22 39c4-19 39-19 44 0v11H22z"/></g>`,
  long2:    (c) => `<path d="M18 36c3-24 49-24 52 0 2 13-4 24-9 33H27c-6-10-11-21-9-33z" fill="${c}"/>`,
};

function buildAvatarSvg([skin, hair, shirt, type], index) {
  const bg = ['#fff1d6', '#dbeafe', '#ffe4e6', '#dcfce7', '#ede9fe'][index % 5];
  const h  = (HAIR_SHAPES[type] || HAIR_SHAPES.short)(hair);
  return `<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="44" cy="44" r="44" fill="${bg}"/>
    ${h}
    <circle cx="44" cy="43" r="20" fill="${skin}"/>
    <path d="M34 61c4 5 16 5 20 0v12H34z" fill="${skin}"/>
    <circle cx="37" cy="43" r="2" fill="#1f2937"/>
    <circle cx="51" cy="43" r="2" fill="#1f2937"/>
    <path d="M37 52c4 4 10 4 14 0" fill="none" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/>
    <path d="M21 88c3-20 15-31 23-31s20 11 23 31z" fill="${shirt}"/>
    <path d="M32 70c5 5 19 5 24 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function DeviceIcon({ type }) {
  if (type === 'phone') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
    </svg>
  );
  if (type === 'tablet') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

export default function AttendeeDashboard() {
  const navigate = useNavigate();

  // User profile
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erms_user') || 'null'); } catch { return null; }
  });
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
  });

  // Registrations
  const [registrations, setRegistrations] = useState({ upcoming: [], past: [] });
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [refunds, setRefunds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erms_refunds') || '[]'); } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState('upcoming');

  // Profile photo
  const [profilePhoto, setProfilePhotoState] = useState(
    () => localStorage.getItem('erms_profile_photo') || null
  );
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(
    () => localStorage.getItem('erms_profile_photo_index') || null
  );

  // Modals
  const [profileOpen, setProfileOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile');
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundDetails, setRefundDetails] = useState('');

  // Bookmarks / Saved Events
  const [savedEvents, setSavedEvents] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Testimonials
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedEventIds, setReviewedEventIds] = useState(new Set());
  const [reviewToast, setReviewToast] = useState({ msg: '', show: false });

  // Notifications
  const [notif, setNotif] = useState({ email: true, sms: false, reminders: true, promotional: false, refundUpdates: true });

  // Appearance
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [compact, setCompact] = useState(false);
  const [language, setLanguage] = useState('English');

  // Security sub-modals
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [secModal, setSecModal] = useState(null);
  const [secSetupPass, setSecSetupPass] = useState('');
  const [secSetupConfirm, setSecSetupConfirm] = useState('');
  const [secSetupEmail, setSecSetupEmail] = useState('');
  const [secLoginPass, setSecLoginPass] = useState('');
  const [secCurrPass, setSecCurrPass] = useState('');
  const [secNewPass, setSecNewPass] = useState('');
  const [secShowCurr, setSecShowCurr] = useState(false);
  const [secShowNew, setSecShowNew] = useState(false);
  const [secToast, setSecToast] = useState({ msg: '', show: false });
  // Real-time connected devices (detected from browser fingerprint)
  const [devices, setDevices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erms_devices') || '[]'); } catch { return []; }
  });

  // Profile toast
  const [profileToast, setProfileToast] = useState({ msg: '', show: false });

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);

  const uploadRef = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName:  user.lastName  || '',
        email:     user.email     || '',
        phone:     user.phone     || '',
        address:   user.address   || '',
      });
    }
  }, [user]);

  useEffect(() => {
    async function loadRegistrations() {
      try {
        const [tickets, events] = await Promise.all([
          apiGetMyRegistrations(),
          apiGetEvents(),
        ]);
        if (!tickets.length) {
          setRegistrations({ upcoming: [], past: [] });
          setLoadingRegistrations(false);
          return;
        }
        const evMap = new Map((events || []).map(e => [String(e.id), e]));
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const enriched = tickets.map(t => {
          const ev = evMap.get(String(t.eventId)) || {};
          // Use the direct API event fields as primary; fall back to enriched event data
          const eventDateStr = t.event_date || ev.date || null;
          const evDate = eventDateStr ? new Date(eventDateStr) : null;
          return {
            title:      t.event_title || ev.title || 'Event',
            date:       fmtDate(eventDateStr) || '—',
            time:       t.event_time || ev.time || '—',
            location:   t.event_location || ev.location || '—',
            price:      Number(t.unit_price || t.price || ev.price) || 0,
            status:     t.status  || 'confirmed',
            ticketCode: t.ticketCode || t.id,
            image:      ev.image  || '/images/Tech1.jpg',
            _date:      evDate,
            _eventId:   t.eventId || ev.id,
          };
        });
        const upcoming = enriched.filter(r => !r._date || r._date >= today);
        const past     = enriched.filter(r =>  r._date && r._date <  today);
        setRegistrations({ upcoming, past });
        setLoadingRegistrations(false);
      } catch {
        setLoadingRegistrations(false);
      }
    }
    loadRegistrations();
    // Load existing testimonials to mark reviewed events
    apiGetTestimonials()
      .then(data => {
        if (Array.isArray(data)) {
          const ids = new Set(data.filter(t => t.userId === user?.id).map(t => t.eventId).filter(Boolean));
          setReviewedEventIds(ids);
        }
      })
      .catch(() => {})
      // Load notification preferences from backend
      .finally(() => {
        apiGetNotificationPrefs()
          .then(data => { if (data && typeof data === 'object') setNotif(prev => ({ ...prev, ...data })); })
          .catch(() => {});
      });
    // Load bookmarked events
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    setLoadingSaved(true);
    try {
      const bookmarked = await apiGetBookmarks();
      if (Array.isArray(bookmarked)) setSavedEvents(bookmarked);
    } catch {}
    setLoadingSaved(false);
  }

  // Refresh bookmarks when tab switches to 'saved'
  useEffect(() => {
    if (activeTab === 'saved') loadBookmarks();
  }, [activeTab]);

  // ── Real-time device detection ──────────────────────────────────────────
  useEffect(() => {
    function detectDevice() {
      const ua = navigator.userAgent;
      const platform = navigator.platform || '';
      const screenW = screen.width;
      const screenH = screen.height;
      const lang = navigator.language;

      // Generate a fingerprint from browser signals
      const fingerprint = [
        ua,
        platform,
        screenW,
        screenH,
        lang,
      ].join('||');

      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const chr = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }

      // Detect device type
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
      const deviceType = isMobile ? (isTablet ? 'tablet' : 'phone') : 'laptop';

      // Detect OS
      let os = 'Unknown OS';
      if (/Windows NT 10/.test(ua)) os = 'Windows 10';
      else if (/Windows NT 11/.test(ua)) os = 'Windows 11';
      else if (/Mac OS X/.test(ua)) {
        const m = ua.match(/Mac OS X ([\d_.]+)/);
        os = m ? 'macOS ' + m[1].replace(/_/g, '.') : 'macOS';
      } else if (/Android/.test(ua)) {
        const m = ua.match(/Android ([\d.]+)/);
        os = m ? 'Android ' + m[1] : 'Android';
      } else if (/iPhone|iPad|iPod/.test(ua)) {
        const m = ua.match(/OS ([\d_]+)/);
        os = m ? 'iOS ' + m[1].replace(/_/g, '.') : 'iOS';
      } else if (/Linux/.test(ua)) os = 'Linux';

      // Detect browser
      let browser = 'Unknown';
      if (/Edg\//.test(ua)) browser = 'Edge';
      else if (/Chrome\//.test(ua)) browser = 'Chrome';
      else if (/Firefox\//.test(ua)) browser = 'Firefox';
      else if (/Safari\//.test(ua)) browser = 'Safari';

      const deviceName = [browser, os].join(' · ');
      const now = new Date();
      const meta = os + ' · ' + screenW + 'x' + screenH;

      return { id: hash, name: deviceName, meta, type: deviceType, os, browser, fingerprint: hash, lastSeen: now.toISOString() };
    }

    const current = detectDevice();
    try {
      const stored = JSON.parse(localStorage.getItem('erms_devices') || '[]');
      const existing = stored.find(d => d.id === current.id);
      if (existing) {
        // Update last seen
        const updated = stored.map(d =>
          d.id === current.id ? { ...d, lastSeen: new Date().toISOString(), meta: current.meta } : d
        );
        localStorage.setItem('erms_devices', JSON.stringify(updated));
        setDevices(updated);
      } else {
        // Add new device
        const updated = [...stored, current];
        localStorage.setItem('erms_devices', JSON.stringify(updated));
        setDevices(updated);
      }
    } catch {
      // Fallback: just show current device
      setDevices([current]);
    }
  }, []);

  // Escape key
  useEscapeKey(() => {
    setSecModal(null);
    setPhotoOpen(false);
  });

  // Body overflow lock
  useBodyScrollLock(profileOpen || photoOpen || cameraOpen || refundModal || !!secModal);

  // ── Review helpers ────────────────────────────────────────────────────────
  function showReviewToast(msg) {
    setReviewToast({ msg, show: true });
    setTimeout(() => setReviewToast(t => ({ ...t, show: false })), 2200);
  }

  async function submitReview() {
    if (!reviewRating) { showReviewToast('Please select a rating'); return; }
    if (!reviewContent.trim()) { showReviewToast('Please write a review'); return; }
    setReviewSubmitting(true);
    try {
      await apiSubmitTestimonial({ content: reviewContent.trim(), rating: reviewRating, eventId: reviewModal.id });
      setReviewedEventIds(prev => new Set([...prev, reviewModal.id]));
      setReviewModal(null);
      setReviewRating(0);
      setReviewContent('');
      showReviewToast('Review submitted! Thank you \u2764\uFE0F');
    } catch (err) {
      showReviewToast('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  // ── Toast helpers ─────────────────────────────────────────────────────────
  function showSecToast(msg) {
    setSecToast({ msg, show: true });
    setTimeout(() => setSecToast(t => ({ ...t, show: false })), 2200);
  }

  function showProfileToast(msg) {
    setProfileToast({ msg, show: true });
    setTimeout(() => setProfileToast(t => ({ ...t, show: false })), 1800);
  }

  // ── Camera (getUserMedia) ────────────────────────────────────────────────
  async function startCamera() {
    setCameraError('');
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions in your browser settings.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : 'Could not open camera: ' + err.message
      );
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraOpen(false);
    setCameraError('');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror the image horizontally (front camera is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    applyPhoto(`<img src="${dataUrl}" alt="Profile picture">`);
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // ── Profile photo ─────────────────────────────────────────────────────────
  function applyPhoto(markup, idx) {
    setProfilePhotoState(markup);
    localStorage.setItem('erms_profile_photo', markup);
    if (idx !== undefined) {
      setSelectedAvatarIndex(String(idx));
      localStorage.setItem('erms_profile_photo_index', String(idx));
    } else {
      setSelectedAvatarIndex(null);
      localStorage.removeItem('erms_profile_photo_index');
    }
    showProfileToast('Profile picture updated');
    setTimeout(() => setPhotoOpen(false), 650);
  }

  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyPhoto(`<img src="${reader.result}" alt="Profile picture">`);
    reader.readAsDataURL(file);
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  function saveProfile() {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    const updated = { ...user, ...profile };
    localStorage.setItem('erms_user', JSON.stringify(updated));
    setUser(updated);
    alert('Profile updated successfully!');
    setProfileOpen(false);
  }

  // ── Dark mode ─────────────────────────────────────────────────────────────
  function handleDarkMode(on) {
    setDarkMode(on);
    document.documentElement.classList.toggle('dark', on);
    localStorage.setItem('erms_theme', on ? 'dark' : 'light');
  }

  // ── Refund ────────────────────────────────────────────────────────────────
  async function submitRefund() {
    if (!refundReason) { alert('Please select a reason for refund.'); return; }
    try {
      await apiRequestRefund(refundModal.ticketCode, refundModal.eventName, refundReason, refundDetails);
    } catch {}
    const newRefund = {
      ticketCode: refundModal.ticketCode,
      eventName:  refundModal.eventName,
      reason:     refundReason,
      details:    refundDetails,
      status:     'pending',
      requestedAt: new Date().toISOString(),
    };
    const stored = [...refunds, newRefund];
    setRefunds(stored);
    localStorage.setItem('erms_refunds', JSON.stringify(stored));
    setRefundModal(null);
    alert('Refund request submitted!\n\nOur team will review your request within 1–3 business days.');
  }

  // ── Security helpers ──────────────────────────────────────────────────────
  function openSecModal(type) {
    if (type === 'setup') {
      setSecModal(tfaEnabled ? 'login' : 'setup1');
    } else {
      setSecModal(type);
    }
  }

  function secFinishSetup() {
    setTfaEnabled(true);
    setSecModal(null);
    showSecToast('Two-Step Verification enabled ✓');
  }

  function secDoLogin() {
    if (!secLoginPass) { showSecToast('Please enter your password'); return; }
    setSecModal(null);
    showSecToast('Signed in successfully');
  }

  function secChangePassword() {
    if (!secCurrPass || !secNewPass) { showSecToast('Please fill in all fields'); return; }
    if (secNewPass.length < 8) { showSecToast('New password must be at least 8 characters'); return; }
    setSecModal(null);
    showSecToast('Password updated successfully ✓');
  }

  function removeDevice(id) {
    const dev = devices.find(d => d.id === id);
    const updated = devices.filter(d => d.id !== id);
    setDevices(updated);
    try { localStorage.setItem('erms_devices', JSON.stringify(updated)); } catch {}
    showSecToast(`${dev?.name || 'Device'} removed`);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const events    = activeTab === 'past' ? registrations.past : (activeTab === 'saved' ? savedEvents : registrations.upcoming);
  const allEvents = [...registrations.upcoming, ...registrations.past];
  const totalSpent = allEvents.reduce((s, e) => s + (e.price || 0), 0);

  const REFUND_BADGE  = { pending: 'refund-pending', approved: 'refund-approved', rejected: 'refund-rejected' };
  const REFUND_LABEL  = { pending: 'Refund Pending', approved: 'Refund Approved', rejected: 'Refund Rejected' };

  function getRefund(ticketCode) {
    return refunds.find(r => r.ticketCode === ticketCode);
  }

  function openTicket(ev) {
    localStorage.setItem('erms_ticket_code',  ev.ticketCode);
    localStorage.setItem('erms_ticket_event', JSON.stringify(ev));
    navigate('/ticket');
  }

  // ── Avatar display ────────────────────────────────────────────────────────
  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?';

  function AvatarDisplay() {
    if (!profilePhoto) return <>{initial}</>;
    return <span dangerouslySetInnerHTML={{ __html: profilePhoto }} />;
  }

  return (
    <>
      {/* ── Navbar ── */}
      <DashboardNavbar />

      {/* ── Dashboard ── */}
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>My Dashboard</h1>
            <p>Manage your event registrations and tickets</p>
          </div>
          <button className="btn btn-outline" onClick={() => setProfileOpen(true)}>
            <i className="ri-settings-3-line" /> Profile Settings
          </button>
        </div>

        <div className="dashboard-body">

          {/* Stat Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="label">Total Events</div>
                <div className="value">{allEvents.length}</div>
              </div>
              <div className="stat-card-icon"><i className="ri-file-list-3-line" /></div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="label">Upcoming Events</div>
                <div className="value">{registrations.upcoming.length}</div>
              </div>
              <div className="stat-card-icon"><i className="ri-checkbox-circle-line" /></div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="label">Total Spent</div>
                <div className="value">${totalSpent}</div>
              </div>
              <div className="stat-card-icon"><i className="ri-download-line" /></div>
            </div>
          </div>

          {/* Tab Filter */}
          <div className="tab-filter">
            <button
              className={`tab-filter-btn${activeTab === 'upcoming' ? ' active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({registrations.upcoming.length})
            </button>
            <button
              className={`tab-filter-btn${activeTab === 'past' ? ' active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past ({registrations.past.length})
            </button>
            <button
              className={`tab-filter-btn${activeTab === 'saved' ? ' active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <i className="ri-bookmark-line" /> Saved ({savedEvents.length})
            </button>
          </div>

          {/* Events Grid */}
          {loadingRegistrations ? (
            <>
              {[1, 2, 3].map(i => (
                <div className="event-list-item" key={i} style={{ opacity: 0.6, pointerEvents: 'none' }}>
                  <div className="event-list-img">
                    <div style={{ width: '100%', height: '100%', background: 'var(--border)', borderRadius: 8 }} />
                    <span className="price-tag" style={{ background: 'var(--border)', color: 'transparent' }}>$--</span>
                  </div>
                  <div className="event-list-info">
                    <div className="event-list-header">
                      <div style={{ background: 'var(--border)', height: 16, width: 80, borderRadius: 4 }} />
                      <div style={{ background: 'var(--border)', height: 12, width: 100, borderRadius: 4 }} />
                    </div>
                    <div style={{ background: 'var(--border)', height: 20, width: '60%', borderRadius: 4, margin: '10px 0 8px' }} />
                    <div className="event-meta">
                      <div className="event-meta-item"><div style={{ background: 'var(--border)', height: 14, width: 140, borderRadius: 4 }} /></div>
                      <div className="event-meta-item"><div style={{ background: 'var(--border)', height: 14, width: 120, borderRadius: 4 }} /></div>
                    </div>
                    <div className="event-list-actions">
                      <div style={{ background: 'var(--border)', height: 32, width: 130, borderRadius: 6 }} />
                      <div style={{ background: 'var(--border)', height: 32, width: 100, borderRadius: 6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : activeTab === 'saved' ? (
            loadingSaved ? (
              <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" /></div>
            ) : savedEvents.length === 0 ? (
              <div className="empty-state">
                <i className="ri-bookmark-line" style={{ fontSize: 40, color: 'var(--text-light)', marginBottom: 12, display: 'block' }} />
                <p>No saved events yet.</p>
                <Link to="/events" className="btn btn-outline" style={{ marginTop: 12 }}>
                  <i className="ri-search-line" /> Browse Events
                </Link>
              </div>
            ) : (
              savedEvents.map((ev) => {
                const eventDate = ev.date ? fmtDate(ev.date) : '—';
                return (
                  <div className="event-list-item" key={ev.id}>
                    <div className="event-list-img">
                      <img
                        src={ev.image || '/images/Tech1.jpg'}
                        alt={ev.title}
                        onError={e => { e.currentTarget.src = '/images/Tech1.jpg'; }}
                      />
                      <span className="price-tag">{Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price)}`}</span>
                    </div>
                    <div className="event-list-info">
                      <div className="event-list-header">
                        <span className="badge badge-available">{ev.category || 'General'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          <i className="ri-bookmark-fill" style={{ color: 'var(--primary)' }} /> Saved
                        </span>
                      </div>
                      <h3>{ev.title}</h3>
                      <div className="event-meta">
                        <div className="event-meta-item"><i className="ri-calendar-line" /> {eventDate}</div>
                        {ev.location && <div className="event-meta-item"><i className="ri-map-pin-line" /> {ev.location}</div>}
                      </div>
                      <div className="event-list-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          localStorage.setItem('erms_selected_event', JSON.stringify(ev));
                          navigate(`/events/${ev.id}`);
                        }}>
                          <i className="ri-eye-line" /> View Event
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={async () => {
                          try {
                            await apiUnbookmarkEvent(ev.id);
                            setSavedEvents(prev => prev.filter(e => e.id !== ev.id));
                          } catch {}
                          const localList = (() => { try { return JSON.parse(localStorage.getItem('erms_saved_events') || '[]'); } catch { return []; } })();
                          localStorage.setItem('erms_saved_events', JSON.stringify(localList.filter(i => i !== ev.id)));
                          window.dispatchEvent(new CustomEvent('erms:bookmarks-updated'));
                        }}>
                          <i className="ri-bookmark-fill" /> Unsave
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : events.length === 0 ? (
            <div className="empty-state"><p>No {activeTab} events found.</p></div>
          ) : (
            events.map((ev) => {
              const refund = getRefund(ev.ticketCode);
              return (
                <div className="event-list-item" key={ev.ticketCode}>
                  <div className="event-list-img">
                    <img
                      src={ev.image}
                      alt={ev.title}
                      onError={e => { e.currentTarget.src = '/images/Sport%20event.jpg'; }}
                    />
                    <span className="price-tag">${ev.price}</span>
                  </div>
                  <div className="event-list-info">
                    <div className="event-list-header">
                      <span className={`badge badge-${ev.status}`}>{ev.status}</span>
                      {refund && (
                        <span className={`badge ${REFUND_BADGE[refund.status] || 'badge-cancelled'}`} style={{ marginLeft: 6 }}>
                          <i className="ri-refund-2-line" /> {REFUND_LABEL[refund.status] || refund.status}
                        </span>
                      )}
                      <span className="ticket-id">Ticket: {ev.ticketCode}</span>
                    </div>
                    <h3>{ev.title}</h3>
                    <div className="event-meta">
                      <div className="event-meta-item"><i className="ri-calendar-line" /> {ev.date}</div>
                      <div className="event-meta-item"><i className="ri-map-pin-line" /> {ev.location}</div>
                    </div>
                    <div className="event-list-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => openTicket(ev)}>
                        <i className="ri-qr-code-line" /> View QR Ticket
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => { openTicket(ev); setTimeout(() => window.print(), 400); }}>
                        <i className="ri-download-line" /> Download
                      </button>
                      {activeTab === 'past' && (
                        reviewedEventIds.has(ev._eventId) ? (
                          <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <i className="ri-check-double-line" /> Reviewed
                          </button>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setReviewModal({ id: ev._eventId, title: ev.title });
                            setReviewRating(0);
                            setReviewContent('');
                          }}>
                            <i className="ri-star-line" /> Write Review
                          </button>
                        )
                      )}
                      {activeTab === 'upcoming' && (
                        refund ? (
                          <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <i className="ri-close-circle-line" /> {REFUND_LABEL[refund.status]}
                          </button>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => setRefundModal({ ticketCode: ev.ticketCode, eventName: ev.title })}>
                            <i className="ri-close-circle-line" /> Request Refund
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>

      {/* ══ Profile Settings Modal ══ */}
      <div className={`modal-overlay${profileOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setProfileOpen(false); }}>
        <div className="modal">
          <div className="modal-header">
            <h3><i className="ri-settings-3-line" /> Profile Settings</h3>
            <button className="modal-close" onClick={() => setProfileOpen(false)}>
              <i className="ri-close-line" />
            </button>
          </div>
          <div className="modal-body">

            {/* Tabs */}
            <div className="modal-tabs">
              {['profile', 'security', 'notification', 'appearance'].map(tab => (
                <button
                  key={tab}
                  className={`modal-tab${profileTab === tab ? ' active' : ''}`}
                  onClick={() => setProfileTab(tab)}
                >
                  <i className={
                    tab === 'profile'      ? 'ri-user-line' :
                    tab === 'security'     ? 'ri-shield-line' :
                    tab === 'notification' ? 'ri-notification-line' :
                    'ri-palette-line'
                  } /> {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            <div className={`modal-tab-content${profileTab === 'profile' ? ' active' : ''}`}>
              <div className="avatar-upload">
                <div className="avatar-big">
                  <AvatarDisplay />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>
                    {user?.email}
                  </div>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => setPhotoOpen(true)}>
                    <i className="ri-camera-line" /> Change Photo
                  </button>
                </div>
              </div>
              {[
                { id: 'firstName', label: 'First Name', type: 'text' },
                { id: 'lastName',  label: 'Last Name',  type: 'text' },
                { id: 'email',     label: 'Email Address', type: 'email' },
                { id: 'phone',     label: 'Phone Number',  type: 'tel' },
                { id: 'address',   label: 'Address',       type: 'text' },
              ].map(f => (
                <div className="form-group" key={f.id}>
                  <label>{f.label}</label>
                  <input
                    type={f.type}
                    value={profile[f.id]}
                    placeholder={f.label}
                    onChange={e => setProfile(p => ({ ...p, [f.id]: e.target.value }))}
                  />
                </div>
              ))}
              <button className="btn btn-primary btn-full" onClick={saveProfile}>
                <i className="ri-save-line" /> Save Changes
              </button>
            </div>

            {/* Security Tab */}
            <div className={`modal-tab-content${profileTab === 'security' ? ' active' : ''}`}>
              <div className="sec-list">
                <button className="sec-list-row" onClick={() => openSecModal('setup')}>
                  <div className="sec-row-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="sec-row-info">
                    <div className="sec-row-label">Two-Step Verification</div>
                    <div className="sec-row-desc">Add an extra password for login</div>
                  </div>
                  <span className={`sec-row-status${tfaEnabled ? '' : ' off'}`}>{tfaEnabled ? 'On' : 'Off'}</span>
                  <svg className="sec-row-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <button className="sec-list-row" onClick={() => openSecModal('password')}>
                  <div className="sec-row-icon green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="sec-row-info">
                    <div className="sec-row-label">Change Password</div>
                    <div className="sec-row-desc">Update your account password</div>
                  </div>
                  <svg className="sec-row-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              <div className="sec-activity">
                <h4>Security Activity</h4>
                <div className="sec-tl">
                  {[
                    { dot: 'blue', date: 'May 12, 2024', event: 'Login from Chrome on MacBook Pro', meta: 'IP: 192.168.1.45 · San Francisco, CA' },
                    { dot: '',     date: 'Apr 30, 2024', event: 'Password changed via web', meta: 'Initiated from Chrome on MacBook Pro' },
                    { dot: 'green',date: 'Apr 22, 2024', event: 'New device linked: iPhone 14', meta: 'First login from this device' },
                  ].map((item, i) => (
                    <div className="sec-tl-item" key={i}>
                      <div className={`sec-tl-dot${item.dot ? ` ${item.dot}` : ''}`} />
                      <div className="sec-tl-date">{item.date}</div>
                      <div>
                        <div className="sec-tl-event">{item.event}</div>
                        <div className="sec-tl-meta">{item.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sec-devices">
                <h4>Connected Devices ({(devices || []).length})</h4>
                <div className="sec-dev-list">
                  {(!devices || devices.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: 28, color: 'var(--text-light)', fontSize: 13 }}>No devices detected yet</div>
                  ) : (
                    [...devices]
                      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
                      .map((d, idx) => {
                        const isCurrent = idx === 0;
                        const lastSeen = new Date(d.lastSeen);
                        const now = new Date();
                        const diffMs = now - lastSeen;
                        const diffMin = Math.floor(diffMs / 60000);
                        const diffHr  = Math.floor(diffMs / 3600000);
                        const diffDay = Math.floor(diffMs / 86400000);
                        let timeAgo;
                        if (diffMin < 1) timeAgo = 'just now';
                        else if (diffMin < 60) timeAgo = diffMin + 'm ago';
                        else if (diffHr < 24) timeAgo = diffHr + 'h ago';
                        else if (diffDay < 7) timeAgo = diffDay + 'd ago';
                        else timeAgo = lastSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <div className={`sec-dev-item${isCurrent ? ' current' : ''}`} key={d.id}>
                            <div className="sec-dev-icon"><DeviceIcon type={d.type || 'laptop'} /></div>
                            <div className="sec-dev-info">
                              <div className="sec-dev-name">
                                {d.name}
                                {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Current</span>}
                              </div>
                              <div className="sec-dev-meta">{d.meta} · {timeAgo}</div>
                            </div>
                            <span className={`sec-dev-badge ${isCurrent ? 'current' : 'old'}`}>
                              {isCurrent ? 'Active' : lastSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <button className="sec-dev-remove" onClick={() => removeDevice(d.id)}>Remove</button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Notifications Tab */}
            <div className={`modal-tab-content${profileTab === 'notification' ? ' active' : ''}`}>
              {[
                { key: 'email',         label: 'Email Notifications',  sub: 'Receive event updates via email' },
                { key: 'sms',           label: 'SMS Notifications',    sub: 'Receive alerts via SMS' },
                { key: 'reminders',     label: 'Event Reminders',      sub: 'Get reminded before events start' },
                { key: 'promotional',   label: 'Promotional Emails',   sub: 'Receive news and offers' },
                { key: 'refundUpdates', label: 'Refund Updates',       sub: 'Get notified on refund status' },
              ].map(item => (
                <div className="setting-row" key={item.key}>
                  <div>
                    <div className="setting-label">{item.label}</div>
                    <div className="setting-sub">{item.sub}</div>
                  </div>
                  <button
                    className={`toggle-switch${notif[item.key] ? ' on' : ''}`}
                    onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key] }))}
                  />
                </div>
              ))}
              <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={async () => {
                try {
                  await apiSaveNotificationPrefs(notif);
                  showProfileToast('Notification preferences saved');
                } catch {
                  showProfileToast('Failed to save preferences');
                }
              }}>
                <i className="ri-save-line" /> Save Preferences
              </button>
            </div>

            {/* Appearance Tab */}
            <div className={`modal-tab-content${profileTab === 'appearance' ? ' active' : ''}`}>
              <div className="setting-row">
                <div>
                  <div className="setting-label">Dark Mode</div>
                  <div className="setting-sub">Switch to dark theme</div>
                </div>
                <button
                  className={`toggle-switch${darkMode ? ' on' : ''}`}
                  onClick={() => handleDarkMode(!darkMode)}
                />
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-label">Compact View</div>
                  <div className="setting-sub">Show more content on screen</div>
                </div>
                <button
                  className={`toggle-switch${compact ? ' on' : ''}`}
                  onClick={() => setCompact(v => !v)}
                />
              </div>
              <div className="setting-row" style={{ border: 'none' }}>
                <div>
                  <div className="setting-label">Language</div>
                  <div className="setting-sub">Choose your preferred language</div>
                </div>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font)', fontSize: 13 }}
                >
                  <option>English</option>
                  <option>ខ្មែរ (Khmer)</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ══ Photo Modal ══ */}
      <div
        className={`photo-modal-overlay${photoOpen ? ' open' : ''}`}
        aria-hidden={!photoOpen}
        onClick={e => { if (e.target === e.currentTarget) setPhotoOpen(false); }}
      >
        <section className="photo-modal" role="dialog" aria-modal="true">
          <header className="photo-modal-header">
            <button className="photo-icon-btn" type="button" onClick={() => setPhotoOpen(false)} aria-label="Close">
              <i className="ri-close-line" />
            </button>
            <div className="photo-modal-title">Add profile picture</div>
            <button className="photo-icon-btn" type="button" aria-label="More options">
              <i className="ri-more-2-fill" />
            </button>
          </header>

          <div className="avatar-gallery-wrap">
            <div className="avatar-gallery" aria-label="Profile picture illustrations">
              {PROFILE_ILLUSTRATIONS.map((avatar, idx) => (
                <button
                  key={idx}
                  className={`avatar-option${String(idx) === String(selectedAvatarIndex) ? ' selected' : ''}`}
                  type="button"
                  aria-label={`Select profile illustration ${idx + 1}`}
                  onClick={() => applyPhoto(buildAvatarSvg(avatar, idx), idx)}
                  dangerouslySetInnerHTML={{ __html: buildAvatarSvg(avatar, idx) }}
                />
              ))}
            </div>
          </div>

          <div className="photo-actions">
            <button className="photo-action-btn" type="button" onClick={() => showProfileToast('More illustrations coming soon')}>
              <i className="ri-gallery-line" /> See more illustrations
            </button>
            <button className="photo-action-btn" type="button" onClick={() => uploadRef.current?.click()}>
              <i className="ri-upload-cloud-2-line" /> Upload from Device
            </button>
            <button className="photo-action-btn" type="button" onClick={startCamera}>
              <i className="ri-camera-3-line" /> Take a picture
            </button>
            <input ref={uploadRef} className="photo-input" type="file" accept="image/*"
              onChange={e => handleFileUpload(e.target.files[0])} />
          </div>
        </section>
      </div>

      {/* ══ Camera Modal ══ */}
      <div
        className={`camera-overlay${cameraOpen || cameraLoading || cameraError ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) stopCamera(); }}
      >
        <div className="camera-modal">
          <div className="camera-header">
            <button className="photo-icon-btn" type="button" onClick={stopCamera} aria-label="Close">
              <i className="ri-close-line" />
            </button>
            <div className="photo-modal-title">Take a picture</div>
            <div style={{ width: 38 }} />
          </div>

          <div className="camera-viewfinder">
            {cameraLoading && (
              <div className="camera-loading">
                <i className="ri-loader-4-line ri-spin" style={{ fontSize: 32, marginBottom: 12 }} />
                <p>Opening camera...</p>
              </div>
            )}
            {cameraError && (
              <div className="camera-error">
                <i className="ri-camera-off-line" style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }} />
                <p>{cameraError}</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setCameraError(''); startCamera(); }}>
                  <i className="ri-refresh-line" /> Try again
                </button>
              </div>
            )}
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
              style={{ display: cameraStream && !cameraError ? 'block' : 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {cameraStream && !cameraError && (
            <div className="camera-footer">
              <button className="camera-capture-btn" type="button" onClick={capturePhoto} aria-label="Capture photo">
                <div className="camera-capture-ring" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile toast */}
      <div className={`profile-toast${profileToast.show ? ' show' : ''}`} role="status" aria-live="polite">
        {profileToast.msg}
      </div>

      {/* ══ Refund Modal ══ */}
      <div className={`modal-overlay${refundModal ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setRefundModal(null); }}>
        <div className="modal">
          <div className="modal-header">
            <h3><i className="ri-refund-2-line" /> Request Refund</h3>
            <button className="modal-close" onClick={() => setRefundModal(null)}>
              <i className="ri-close-line" />
            </button>
          </div>
          <div className="refund-modal-body">
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>Refund for</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{refundModal?.eventName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                Ticket ID: <span>{refundModal?.ticketCode}</span>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How refund works:</div>
            <div className="refund-steps">
              {[
                { title: 'Submit Request', desc: 'Fill in the reason and submit your refund request' },
                { title: 'Review (1–3 business days)', desc: 'Our team will review your request' },
                { title: 'Refund Processed', desc: 'Refund returned to original payment method within 5–7 business days' },
              ].map((s, i) => (
                <div className="refund-step" key={i}>
                  <div className="step-num">{i + 1}</div>
                  <div className="step-info">
                    <div className="s-title">{s.title}</div>
                    <div className="s-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Reason for Refund <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select value={refundReason} onChange={e => setRefundReason(e.target.value)}>
                <option value="">Select a reason</option>
                <option>I can no longer attend</option>
                <option>Event was cancelled</option>
                <option>Duplicate registration</option>
                <option>Medical emergency</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional Details</label>
              <textarea rows={3} value={refundDetails} onChange={e => setRefundDetails(e.target.value)}
                placeholder="Please provide more details..." style={{ resize: 'none' }} />
            </div>

            <div style={{ background: 'var(--bg-orange)', borderRadius: 'var(--border-radius)', padding: '12px 14px', fontSize: 13, color: 'var(--text-medium)', marginBottom: 20, lineHeight: 1.6 }}>
              <i className="ri-information-line" style={{ color: 'var(--primary)' }} />{' '}
              <strong>Refund Policy:</strong> Full refund available up to 7 days before the event. 50% refund within 7 days. No refund within 48 hours of event.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRefundModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={submitRefund}>
                <i className="ri-send-plane-line" /> Submit Refund Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Write Review Modal ══ */}
      <div className={`modal-overlay${reviewModal ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
        <div className="modal">
          <div className="modal-header">
            <h3><i className="ri-star-line" /> Write a Review</h3>
            <button className="modal-close" onClick={() => setReviewModal(null)}>
              <i className="ri-close-line" />
            </button>
          </div>
          <div className="refund-modal-body">
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>Reviewing</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{reviewModal?.title}</div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Your Rating</div>
            <div className="star-rating-input" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className="star-btn"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 32,
                    color: star <= (reviewHover || reviewRating) ? '#f59e0b' : '#d1d5db',
                    transition: 'color 0.15s, transform 0.15s',
                    transform: star <= (reviewHover || reviewRating) ? 'scale(1.15)' : 'scale(1)',
                    padding: 0, lineHeight: 1,
                  }}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  onClick={() => setReviewRating(star)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
              {reviewRating > 0 && (
                <span style={{ fontSize: 14, color: 'var(--text-medium)', alignSelf: 'center', marginLeft: 4 }}>
                  {reviewRating === 1 ? 'Poor' : reviewRating === 2 ? 'Fair' : reviewRating === 3 ? 'Good' : reviewRating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Your Review <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea
                rows={4}
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                placeholder="Share your experience at this event..."
                style={{ resize: 'none', width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font)', fontSize: 14, background: 'var(--bg-white)', color: 'var(--text-dark)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setReviewModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={submitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 6 }} /> Submitting...</>
                ) : (
                  <><i className="ri-send-plane-line" /> Submit Review</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review toast */}
      <div className={`sec-toast${reviewToast.show ? ' show' : ''}`}>{reviewToast.msg}</div>

      {/* ══ Security Sub-Modals ══ */}

      {/* Setup Step 1 */}
      <div className={`sec-modal-overlay${secModal === 'setup1' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSecModal(null); }}>
        <div className="sec-modal">
          <div className="sec-modal-emoji">🔐</div>
          <div className="sec-modal-title">Your Password</div>
          <div className="sec-modal-text">Choose an additional password to protect your account.</div>
          <div className="sec-steps">
            <div className="sec-step-dot active" /><div className="sec-step-dot" /><div className="sec-step-dot" />
          </div>
          <input type="password" className="sec-modal-input" placeholder="Enter password"
            value={secSetupPass} onChange={e => setSecSetupPass(e.target.value)} autoFocus />
          <div className="sec-modal-hint">At least 6 characters</div>
          <div className="sec-modal-actions">
            <button className="sec-btn sec-btn-secondary" onClick={() => setSecModal(null)}>Cancel</button>
            <button className="sec-btn sec-btn-primary" onClick={() => {
              if (secSetupPass.length < 6) { showSecToast('Password must be at least 6 characters'); return; }
              setSecModal('setup2');
            }}>Next</button>
          </div>
        </div>
      </div>

      {/* Setup Step 2 */}
      <div className={`sec-modal-overlay${secModal === 'setup2' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSecModal(null); }}>
        <div className="sec-modal">
          <div className="sec-modal-emoji">🔐</div>
          <div className="sec-modal-title">Confirm Password</div>
          <div className="sec-modal-text">Re-enter your password to make sure it's correct.</div>
          <div className="sec-steps">
            <div className="sec-step-dot active" /><div className="sec-step-dot active" /><div className="sec-step-dot" />
          </div>
          <input type="password" className="sec-modal-input" placeholder="Re-enter password"
            value={secSetupConfirm} onChange={e => setSecSetupConfirm(e.target.value)} autoFocus />
          <div className="sec-modal-actions">
            <button className="sec-btn sec-btn-secondary" onClick={() => setSecModal('setup1')}>Back</button>
            <button className="sec-btn sec-btn-primary" onClick={() => {
              if (secSetupPass !== secSetupConfirm) { showSecToast('Passwords do not match'); return; }
              setSecModal('setup3');
            }}>Next</button>
          </div>
        </div>
      </div>

      {/* Setup Step 3 */}
      <div className={`sec-modal-overlay${secModal === 'setup3' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSecModal(null); }}>
        <div className="sec-modal">
          <div className="sec-modal-emoji">📧</div>
          <div className="sec-modal-title">Recovery Email</div>
          <div className="sec-modal-text">Add a recovery email so you can reset your password if you forget it.</div>
          <div className="sec-steps">
            <div className="sec-step-dot active" /><div className="sec-step-dot active" /><div className="sec-step-dot active" />
          </div>
          <input type="email" className="sec-modal-input" placeholder="your@email.com"
            value={secSetupEmail} onChange={e => setSecSetupEmail(e.target.value)} autoFocus />
          <button className="sec-modal-link" onClick={secFinishSetup}>Skip for now</button>
          <div className="sec-modal-actions">
            <button className="sec-btn sec-btn-secondary" onClick={() => setSecModal('setup2')}>Back</button>
            <button className="sec-btn sec-btn-primary" onClick={secFinishSetup}>Done</button>
          </div>
        </div>
      </div>

      {/* TFA Login */}
      <div className={`sec-modal-overlay${secModal === 'login' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSecModal(null); }}>
        <div className="sec-modal">
          <div className="sec-modal-emoji">🔐</div>
          <div className="sec-modal-title">Your Password</div>
          <div className="sec-modal-text">Two-Step Verification is enabled. Enter your additional password to continue.</div>
          <input type="password" className="sec-modal-input" placeholder="Password"
            value={secLoginPass} onChange={e => setSecLoginPass(e.target.value)} autoFocus />
          <button className="sec-modal-link" onClick={() => setSecModal('forgot')}>Forgot password?</button>
          <div className="sec-modal-actions">
            <button className="sec-btn sec-btn-secondary" onClick={() => setSecModal(null)}>Cancel</button>
            <button className="sec-btn sec-btn-primary" onClick={secDoLogin}>Next</button>
          </div>
        </div>
      </div>

      {/* Forgot */}
      <div className={`sec-modal-overlay${secModal === 'forgot' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSecModal(null); }}>
        <div className="sec-modal">
          <div className="sec-modal-emoji">😕</div>
          <div className="sec-modal-title">Sorry</div>
          <div className="sec-modal-text">Since you didn't provide a recovery email, you can either remember your password or wait 7 days for a reset.</div>
          <div className="sec-modal-actions">
            <button className="sec-btn sec-btn-secondary" onClick={() => setSecModal(null)}>Cancel</button>
            <button className="sec-btn sec-btn-danger" onClick={() => {
              setSecModal(null);
              showSecToast('Reset request sent. Check back in 7 days.');
            }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className={`sec-modal-overlay${secModal === 'password' ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSecModal(null); }}>
        <div className="sec-modal">
          <div className="sec-modal-emoji">🔑</div>
          <div className="sec-modal-title">Change Password</div>
          <div className="sec-modal-text">Enter your current password, then choose a new one.</div>
          <div className="sec-pw-field">
            <input type={secShowCurr ? 'text' : 'password'} placeholder="Current password"
              value={secCurrPass} onChange={e => setSecCurrPass(e.target.value)} />
            <button className="sec-pw-eye" type="button" onClick={() => setSecShowCurr(v => !v)}>
              {secShowCurr ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <div className="sec-pw-field">
            <input type={secShowNew ? 'text' : 'password'} placeholder="New password (min 8 chars)"
              value={secNewPass} onChange={e => setSecNewPass(e.target.value)} />
            <button className="sec-pw-eye" type="button" onClick={() => setSecShowNew(v => !v)}>
              {secShowNew ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <div className="sec-modal-actions">
            <button className="sec-btn sec-btn-secondary" onClick={() => setSecModal(null)}>Cancel</button>
            <button className="sec-btn sec-btn-primary" onClick={secChangePassword}>Update</button>
          </div>
        </div>
      </div>

      {/* Security toast */}
      <div className={`sec-toast${secToast.show ? ' show' : ''}`}>{secToast.msg}</div>
    </>
  );
}

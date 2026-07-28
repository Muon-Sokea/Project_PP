import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNotifications } from '../../../context/NotificationContext.jsx';
import { useScrollListener } from '../../../hooks/useScrollListener.js';
import { apiGetBookmarks } from '../../../services/bookmark.service.js';
import '../../../../assets/css/2_navbar.css';
import './DashboardNavbar.css';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="notification-bell" ref={ref}>
      <button
        className="nav-icon-btn"
        onClick={() => setOpen(v => !v)}
        title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      >
        <i className={unreadCount > 0 ? 'ri-notification-3-fill' : 'ri-notification-3-line'} />
        {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notification-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div className="notification-dropdown-list">
            {notifications.length === 0 && (
              <div className="notification-empty">No notifications yet.</div>
            )}
            {notifications.map(n => (
              <button
                key={n.id}
                className={`notification-item${n.read ? '' : ' unread'}`}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
              >
                <div className="notification-item-title">{n.title}</div>
                {n.message && <div className="notification-item-message">{n.message}</div>}
                <div className="notification-item-time">{timeAgo(n.createdAt)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('erms_theme') === 'dark' ||
      (!localStorage.getItem('erms_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('erms_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      className="dark-mode-toggle"
      onClick={() => setDark(d => !d)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <i className={dark ? 'ri-sun-line' : 'ri-moon-line'} />
    </button>
  );
}

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const navScrolled = useScrollListener();

  // Determine current page for nav highlighting
  const isDashboard = location.pathname === '/dashboard' ||
    location.pathname === '/admin' ||
    location.pathname === '/organizer' ||
    location.pathname === '/superadmin';
  const isBookmarks = location.pathname === '/bookmarks';

  // Redirect user to role-specific dashboard
  const ROLE_ROUTES = {
    Supervisor: '/superadmin', Admin: '/admin',
    Organizer:  '/organizer',  Attendee: '/dashboard',
  };
  // Read role from localStorage since this component doesn't have direct access to useAuth role
  const roleRoute = (() => {
    try { return ROLE_ROUTES[localStorage.getItem('erms_role')] || '/'; } catch { return '/'; }
  })();

  useEffect(() => {
    function loadCount() {
      apiGetBookmarks().then(data => {
        if (Array.isArray(data)) setBookmarkCount(data.length);
      }).catch(() => {});
    }
    loadCount();
    window.addEventListener('erms:bookmarks-updated', loadCount);
    return () => window.removeEventListener('erms:bookmarks-updated', loadCount);
  }, []);

  return (
    <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
      <Link className="nav-logo" to="/">
        <span className="logo-top">Planning</span>
        <span className="logo-bottom">Center</span>
      </Link>
      <button
        className={`hamburger${navOpen ? ' open' : ''}`}
        onClick={() => setNavOpen(v => !v)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>
      <div className={`nav-links${navOpen ? ' open' : ''}`}>
        <button className="btn btn-outline" onClick={() => { navigate('/'); setNavOpen(false); }}>
          <i className="ri-home-line" /> Home
        </button>
        <button className={isDashboard ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => { navigate(roleRoute); setNavOpen(false); }}>
          <i className="ri-dashboard-line" /> Dashboard
        </button>
        <button
          className={`nav-icon-btn${isBookmarks ? ' active' : ''}`}
          onClick={() => { navigate('/bookmarks'); setNavOpen(false); }}
          title={`${bookmarkCount} saved event${bookmarkCount !== 1 ? 's' : ''}`}
          aria-label={`${bookmarkCount} saved event${bookmarkCount !== 1 ? 's' : ''}`}
        >
          <i className={bookmarkCount > 0 ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
          {bookmarkCount > 0 && <span className="nav-badge">{bookmarkCount}</span>}
        </button>
        <NotificationBell />
        <DarkModeToggle />
        <button className="btn btn-outline" onClick={logout}>
          <i className="ri-logout-box-r-line" /> Logout
        </button>
      </div>
    </nav>
  );
}

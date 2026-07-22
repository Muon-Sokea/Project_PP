import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useScrollListener } from '../../../hooks/useScrollListener.js';
import '../../../../assets/css/2_navbar.css';
import './DashboardNavbar.css';

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
  const { logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const navScrolled = useScrollListener();

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
        <button className="btn btn-primary">
          <i className="ri-dashboard-line" /> Dashboard
        </button>
        <DarkModeToggle />
        <button className="btn btn-outline" onClick={logout}>
          <i className="ri-logout-box-r-line" /> Logout
        </button>
      </div>
    </nav>
  );
}

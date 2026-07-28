import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiGetBookmarks, apiUnbookmarkEvent } from '../../services/bookmark.service.js';
import { fmtDate } from '../../utils/formatDate.js';
import DashboardNavbar from '../../components/layout/DashboardNavbar/DashboardNavbar.jsx';
import '../../../assets/css/1_global.css';
import '../../../assets/css/2_navbar.css';
import './BookmarksPage.css';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookmarked, setBookmarked] = useState(() => {
    // Initialize from localStorage as fallback while API loads
    try { return JSON.parse(localStorage.getItem('erms_saved_events_detail') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGetBookmarks();
        const apiEvents = Array.isArray(data) ? data : [];
        // Merge API results with localStorage detail cache (for mock/offline events)
        const localDetail = (() => {
          try { return JSON.parse(localStorage.getItem('erms_saved_events_detail') || '[]'); } catch { return []; }
        })();
        const apiIds = new Set(apiEvents.map(e => e.id));
        const merged = [...apiEvents, ...localDetail.filter(e => !apiIds.has(e.id))];
        setBookmarked(merged);
        try { localStorage.setItem('erms_saved_events_detail', JSON.stringify(merged)); } catch {}
        setError('');
      } catch (err) {
        // API failed — show localStorage fallback
        const localDetail = (() => {
          try { return JSON.parse(localStorage.getItem('erms_saved_events_detail') || '[]'); } catch { return []; }
        })();
        if (localDetail.length > 0) {
          setBookmarked(localDetail);
          setError('Could not sync with server; showing locally saved events.');
        } else {
          setError('Could not load saved events from server.');
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleUnsave(eventId) {
    try {
      await apiUnbookmarkEvent(eventId);
      setBookmarked(prev => prev.filter(e => e.id !== eventId));
      window.dispatchEvent(new CustomEvent('erms:bookmarks-updated'));
    } catch {}
    const localList = (() => {
      try { return JSON.parse(localStorage.getItem('erms_saved_events') || '[]'); } catch { return []; }
    })();
    localStorage.setItem('erms_saved_events', JSON.stringify(localList.filter(i => i !== eventId)));
  }

  function viewEvent(ev) {
    localStorage.setItem('erms_selected_event', JSON.stringify(ev));
    navigate(`/events/${ev.id}`);
  }

  return (
    <div className="bookmarks-page">
      <DashboardNavbar />

      {/* ── Hero Banner ── */}
      <section className="bm-hero">
        <div className="bm-hero-bg" />
        <div className="bm-hero-content">
          <div className="bm-hero-icon">
            <i className="ri-bookmark-fill" />
          </div>
          <h1>Saved Events</h1>
          <p>
            {bookmarked.length > 0
              ? `You have ${bookmarked.length} saved event${bookmarked.length !== 1 ? 's' : ''}`
              : 'Events you bookmark will appear here'}
          </p>
        </div>
      </section>

      <div className="bm-body">
        {error && (
          <div style={{
            background: 'var(--bg-orange, #fff7ed)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--border-radius)',
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--text-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <i className="ri-information-line" style={{ color: 'var(--primary)' }} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="bm-loading">
            <div className="spinner" />
          </div>
        ) : bookmarked.length === 0 ? (
          <div className="bm-empty">
            <div className="bm-empty-illustration">
              <i className="ri-bookmark-3-line" />
            </div>
            <h3>Nothing saved yet</h3>
            <p>Start exploring events and tap the bookmark icon to save them for later.</p>
            <Link to="/events" className="btn btn-primary">
              <i className="ri-search-line" /> Browse Events
            </Link>
          </div>
        ) : (
          <>
            <div className="bm-stats-bar">
              <div className="bm-stat">
                <span className="bm-stat-value">{bookmarked.length}</span>
                <span className="bm-stat-label">Saved</span>
              </div>
              <div className="bm-stat">
                <span className="bm-stat-value">
                  ${bookmarked.reduce((s, e) => s + Number(e.price || 0), 0).toLocaleString()}
                </span>
                <span className="bm-stat-label">Total Value</span>
              </div>
              <div className="bm-stat">
                <span className="bm-stat-value">
                  {new Set(bookmarked.map(e => e.category)).size}
                </span>
                <span className="bm-stat-label">Categories</span>
              </div>
            </div>

            <div className="bm-grid">
              {bookmarked.map(ev => (
                <div
                  key={ev.id}
                  className="bm-card"
                  onClick={() => viewEvent(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && viewEvent(ev)}
                >
                  <div className="bm-card-img">
                    <img
                      src={ev.image || '/images/Tech1.jpg'}
                      alt={ev.title}
                      onError={e => { e.target.src = '/images/Tech1.jpg'; }}
                    />
                    <span className="bm-card-cat">{ev.category || 'General'}</span>
                    <span className="bm-card-price">
                      {Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price)}`}
                    </span>
                  </div>
                  <div className="bm-card-body">
                    <h3>{ev.title}</h3>
                    <div className="bm-card-meta">
                      <span><i className="ri-calendar-line" /> {fmtDate(ev.date)}</span>
                      {ev.time && <span><i className="ri-time-line" /> {ev.time}</span>}
                      <span><i className="ri-map-pin-line" /> {ev.location}</span>
                    </div>
                    <div className="bm-card-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={e => { e.stopPropagation(); viewEvent(ev); }}
                      >
                        <i className="ri-eye-line" /> View
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={e => { e.stopPropagation(); handleUnsave(ev.id); }}
                      >
                        <i className="ri-bookmark-fill" /> Unsave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetEvents } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import '../../assets/css/3_hero.css';
import '../../assets/css/4_events.css';
import '../../assets/css/8_testimonials.css';
import '../../assets/css/10_features.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'All','Technology','Sports','Education','Workshop',
  'Business','Entertainment','Networking','Healthcare',
];

const ROLE_ROUTES = {
  Supervisor: '/superadmin', Admin: '/admin',
  Organizer:  '/organizer',  Attendee: '/dashboard',
};

const TOTAL_SLIDES  = 4;
const SLIDE_SPEED   = 850;
const SLIDE_DELAY   = 4500;
const INITIAL_COUNT = 12;

const REVIEWS = [
  { id: 1, name: 'Sokchea Lim',  username: '@sokchea_events', role: 'Event Organizer',
    body: 'I ran a 2,000-seat tech summit through Planning Center. Real-time seat tracking meant we never oversold a single ticket.' },
  { id: 2, name: 'Dara Phon',    username: '@daraphon',       role: 'Attendee',
    body: 'Booked my workshop spot in under a minute and the QR ticket landed in my dashboard instantly. No printing, no queues.' },
  { id: 3, name: 'Mealea Sok',   username: '@mealea.k',       role: 'Marketing Lead',
    body: 'The category filters and search made it effortless to find every networking event in Phnom Penh this quarter.' },
  { id: 4, name: 'Rithy Chan',   username: '@rithy_runs',     role: 'Sports Coordinator',
    body: 'Managing 6,000 runners used to be chaos. Now check-in is just scanning codes at the start line — done in seconds.' },
  { id: 5, name: 'Bopha Nuon',   username: '@bopha.designs',  role: 'UX Designer',
    body: 'Honestly the cleanest event dashboard I\'ve used. Dark mode at 11 pm while finalizing my schedule? Chef\'s kiss.' },
  { id: 6, name: 'Visal Kong',   username: '@visalk',         role: 'Conference Speaker',
    body: 'Got my confirmation, ticket, and reminder without a single email thread. The whole flow just quietly works.' },
  { id: 7, name: 'Channary Ros', username: '@channary',       role: 'First-time Attendee',
    body: 'As a first-timer I never felt lost — the prompts told me exactly what to do at each step of registration.' },
  { id: 8, name: 'Pisey Hang',   username: '@pisey_h',        role: 'Volunteer Lead',
    body: 'Refund requests that used to take days are now handled right in the dashboard in a couple of clicks.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatus(attending, capacity) {
  return attending >= capacity ? 'Full' : 'Available';
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initials(name) {
  return name.split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();
}

function avatarUrl(r) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.username || r.name)}`;
}

function applyThemeClass(mode) {
  const dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

function highlightMatch(text, query) {
  const q = query.trim();
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    text.slice(0, i) +
    '<mark>' + text.slice(i, i + q.length) + '</mark>' +
    text.slice(i + q.length)
  );
}

// ── TestiCard (memoized, pure) ────────────────────────────────────────────────
function TestiCard({ r, isClone }) {
  return (
    <article
      className="t-card"
      aria-hidden={isClone || undefined}
      tabIndex={isClone ? -1 : 0}
    >
      <span className="t-orb" aria-hidden="true" />
      <div className="t-head">
        <div className="t-avatar" role="img" aria-label={r.name}>
          <span aria-hidden="true">{initials(r.name)}</span>
          <img
            src={avatarUrl(r)} alt="" loading="lazy"
            onError={e => e.target.remove()}
          />
          <span className="t-online" aria-hidden="true" />
        </div>
        <div>
          <div className="t-name">{r.name}</div>
          <div className="t-user">{r.username}</div>
        </div>
      </div>
      <p className="t-body">
        <span className="t-quote" aria-hidden="true">&ldquo;</span>
        {r.body}
      </p>
      <span className="t-role">{r.role}</span>
    </article>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({ event, index, onClick }) {
  const status = getStatus(event.attending ?? 0, event.capacity ?? 1);
  const delay  = Math.min(index * 0.05, 0.6);
  return (
    <div
      className="event-card fade-up"
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="event-card-img">
        <img
          src={event.image || '/images/Tech1.jpg'}
          alt={event.title}
          onError={e => { e.target.src = '/images/Tech1.jpg'; e.target.onerror = null; }}
        />
        <span className={`badge ${status === 'Full' ? 'badge-full' : 'badge-available'}`}>
          {status}
        </span>
      </div>
      <div className="event-card-body">
        <div className="event-category">
          {event.category}
          <span className="event-rating">
            <i className="ri-star-fill" style={{ color: 'var(--primary)' }} />
            {(event.rating ?? 4).toFixed(1)}
          </span>
        </div>
        <h3 className="event-title">{event.title}</h3>
        <div className="event-meta">
          <div className="event-meta-item">
            <i className="ri-calendar-line" /> {fmtDate(event.date)}
          </div>
          <div className="event-meta-item">
            <i className="ri-map-pin-line" /> {event.location}
          </div>
        </div>
        <div className="event-card-footer">
          <span className="event-price">
            {Number(event.price) === 0 ? 'Free' : `$${Number(event.price)}`}
          </span>
          <span className="event-attendees">
            <i className="ri-group-line" />
            {(event.attending ?? 0).toLocaleString()} attending
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function EventsPage() {
  const navigate        = useNavigate();
  const { user, logout } = useAuth();

  // events
  const [events,        setEvents]        = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // filters / pagination
  const [category,      setCategory]      = useState('All');
  const [search,        setSearch]        = useState('');
  const [visibleCount,  setVisibleCount]  = useState(INITIAL_COUNT);

  // navbar
  const [navOpen,       setNavOpen]       = useState(false);
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [theme,         setTheme]         = useState(() => localStorage.getItem('erms_theme') || 'auto');

  // slideshow (dots only via state; track via ref)
  const [slideDot,      setSlideDot]      = useState(0);
  const trackRef    = useRef(null);
  const animating   = useRef(false);
  const goToSlideRef= useRef(null);   // set inside the slideshow useEffect

  // search suggestions
  const [suggestions,  setSuggestions]  = useState([]);
  const [suggIdx,      setSuggIdx]      = useState(-1);
  const [suggOpen,     setSuggOpen]     = useState(false);
  const searchRef = useRef(null);

  // ── Load events ────────────────────────────────────────────────────────────
  useEffect(() => {
    apiGetEvents()
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('erms_theme', theme);
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const cb = () => { if (theme === 'auto') applyThemeClass('auto'); };
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, [theme]);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavScrolled(y > 8);
      setShowScrollTop(y > 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Ripple ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className      = 'ripple';
      ripple.style.width    = ripple.style.height = size + 'px';
      ripple.style.left     = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top      = (e.clientY - rect.top  - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ── Slideshow ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.style.transition = 'none';
    track.style.transform  = 'translateX(0%)';

    let idx   = 0;
    let anim  = false;

    function move(position, animate) {
      track.style.transition = animate
        ? `transform ${SLIDE_SPEED}ms cubic-bezier(0.645,0.045,0.355,1.000)` : 'none';
      track.style.transform = `translateX(-${position * 20}%)`;
    }

    function next() {
      if (anim) return;
      anim = true;
      const n = idx + 1;
      if (n < TOTAL_SLIDES) {
        idx = n; move(idx, true); setSlideDot(idx);
        setTimeout(() => { anim = false; }, SLIDE_SPEED);
      } else {
        move(4, true); setSlideDot(0);
        setTimeout(() => {
          idx = 0; move(0, false);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            track.style.transition =
              `transform ${SLIDE_SPEED}ms cubic-bezier(0.645,0.045,0.355,1.000)`;
          }));
          anim = false;
        }, SLIDE_SPEED + 50);
      }
    }

    goToSlideRef.current = (target) => {
      if (anim || target === idx) return;
      anim = true; idx = target;
      move(idx, true); setSlideDot(idx);
      clearInterval(timer);
      timer = setInterval(next, SLIDE_DELAY);
      setTimeout(() => { anim = false; }, SLIDE_SPEED);
    };

    let timer = setInterval(next, SLIDE_DELAY);

    // Swipe
    const hero = track.closest('.hero');
    let touchX = 0;
    const onTS = (e) => { touchX = e.touches[0].clientX; };
    const onTE = (e) => {
      const d = touchX - e.changedTouches[0].clientX;
      if (d > 50) next();
      else if (d < -50) goToSlideRef.current((idx - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    };
    hero?.addEventListener('touchstart', onTS, { passive: true });
    hero?.addEventListener('touchend',   onTE, { passive: true });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      track.style.transition =
        `transform ${SLIDE_SPEED}ms cubic-bezier(0.645,0.045,0.355,1.000)`;
    }));

    return () => {
      clearInterval(timer);
      hero?.removeEventListener('touchstart', onTS);
      hero?.removeEventListener('touchend',   onTE);
    };
  }, []);

  // ── Filter / pagination helpers ────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let list = events;
    if (category !== 'All') {
      list = list.filter(e => e.category?.toLowerCase() === category.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, category, search]);

  // reset visible count on filter change
  useEffect(() => { setVisibleCount(INITIAL_COUNT); }, [category, search]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const remaining     = filteredEvents.length - visibleCount;

  function handleCategoryFilter(cat) {
    setCategory(cat);
  }

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    if (val.trim()) {
      const sug = buildSuggestions(val, events);
      setSuggestions(sug);
      setSuggOpen(sug.length > 0);
    } else {
      setSuggestions([]);
      setSuggOpen(false);
    }
    setSuggIdx(-1);
  }

  function handleSearchKey(e) {
    if (!suggOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && suggIdx >= 0) {
      e.preventDefault();
      chooseSuggestion(suggIdx);
    } else if (e.key === 'Escape') {
      setSuggOpen(false);
    }
  }

  function chooseSuggestion(i) {
    const s = suggestions[i];
    if (!s) return;
    setSearch(s.text);
    setSuggOpen(false);
    setSuggestions([]);
    setSuggIdx(-1);
    const grid = document.getElementById('eventsGrid');
    grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleClickOutsideSuggestions(e) {
    if (!e.target.closest('.search-wrap')) setSuggOpen(false);
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutsideSuggestions);
    return () => document.removeEventListener('click', handleClickOutsideSuggestions);
  }, []);

  function viewEvent(ev) {
    localStorage.setItem('erms_selected_event', JSON.stringify(ev));
    navigate(`/events/${ev.id}`);
  }

  function goToDashboard() {
    const role = localStorage.getItem('erms_role');
    navigate(ROLE_ROUTES[role] || '/');
  }

  // ── Reduced motion ─────────────────────────────────────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Navbar ── */}
      <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
        <Link className="nav-logo" to="/">
          <span className="logo-top">Planning</span>
          <span className="logo-bottom">Center</span>
        </Link>

        <button
          className={`hamburger${navOpen ? ' active' : ''}`}
          id="hamburger"
          aria-label="Toggle menu"
          onClick={() => setNavOpen(v => !v)}
        >
          <span /><span /><span />
        </button>

        <div className={`nav-links${navOpen ? ' open' : ''}`} id="navLinks">
          {user && (
            <span className="nav-greeting">Hi, {user.firstName}!</span>
          )}

          <button className="btn btn-primary" onClick={() => setNavOpen(false)}>
            <i className="ri-home-line" /> Home
          </button>
          <button className="btn btn-outline" onClick={() => { setNavOpen(false); goToDashboard(); }}>
            <i className="ri-dashboard-line" /> Dashboard
          </button>
          <button className="btn btn-outline" onClick={() => { setNavOpen(false); logout(); navigate('/login'); }}>
            <i className="ri-logout-box-r-line" /> Logout
          </button>

          {/* Theme seg */}
          <div id="themeSeg" className="theme-seg" role="group" aria-label="Theme">
            {[
              { mode: 'light', icon: 'ri-sun-line',      label: 'Light theme',  title: 'Light'  },
              { mode: 'auto',  icon: 'ri-computer-line', label: 'Match system', title: 'System' },
              { mode: 'dark',  icon: 'ri-moon-line',     label: 'Dark theme',   title: 'Dark'   },
            ].map(({ mode, icon, label, title }) => (
              <button
                key={mode}
                type="button"
                data-mode={mode}
                aria-label={label}
                aria-pressed={theme === mode}
                title={title}
                className={theme === mode ? 'active' : ''}
                onClick={() => setTheme(mode)}
              >
                <i className={icon} />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero Slideshow ── */}
      <section className="hero">
        <div className="hero-slides" ref={trackRef}>
          <div className="hero-slide" />
          <div className="hero-slide" />
          <div className="hero-slide" />
          <div className="hero-slide" />
          <div className="hero-slide clone" />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Discover Amazing Events</h1>
          <p>Join thousands of attendees at conferences, workshops, and networking events</p>
          <div className="search-wrap">
            <div className="search-bar">
              <input
                type="text"
                id="searchInput"
                ref={searchRef}
                autoComplete="off"
                role="combobox"
                aria-expanded={suggOpen}
                aria-autocomplete="list"
                aria-controls="searchSuggestions"
                aria-label="Search events"
                placeholder="Search events, categories, locations…"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKey}
              />
              <button
                className="search-btn"
                aria-label="Search"
                onClick={() => setSuggOpen(false)}
              >
                <i className="ri-search-line" aria-hidden="true" />
              </button>
            </div>
            {suggOpen && suggestions.length > 0 && (
              <ul
                className="search-suggestions open"
                id="searchSuggestions"
                role="listbox"
                aria-label="Search suggestions"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    className={`suggestion-item${i === suggIdx ? ' active' : ''}`}
                    role="option"
                    aria-selected={i === suggIdx}
                    onMouseDown={() => chooseSuggestion(i)}
                  >
                    <i className={s.icon} aria-hidden="true" />
                    <span
                      dangerouslySetInnerHTML={{ __html: highlightMatch(s.text, search) }}
                    />
                    <span className="s-type">{s.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="hero-dots">
          {[0, 1, 2, 3].map(i => (
            <button
              key={i}
              className={`hero-dot${slideDot === i ? ' active' : ''}`}
              onClick={() => goToSlideRef.current?.(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="stats-bar">
        <div className="stat-item">
          <div className="stat-icon"><i className="ri-calendar-check-line" /></div>
          <div className="stat-number">150+</div>
          <div className="stat-label">Upcoming Events</div>
        </div>
        <div className="stat-item">
          <div className="stat-icon"><i className="ri-group-line" /></div>
          <div className="stat-number">50K+</div>
          <div className="stat-label">Total Attendees</div>
        </div>
        <div className="stat-item">
          <div className="stat-icon"><i className="ri-bar-chart-line" /></div>
          <div className="stat-number">90%</div>
          <div className="stat-label">Satisfaction Rate</div>
        </div>
      </section>

      {/* ── Events Catalog ── */}
      <main className="events-section">
        <div className="filter-row">
          <i className="ri-filter-3-line" style={{ color: 'var(--text-medium)' }} />
          <span style={{ fontWeight: 500 }}>Filter by Category</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-pill${category === cat ? ' active' : ''}`}
              data-category={cat}
              onClick={() => handleCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="events-grid" id="eventsGrid">
          {loadingEvents ? (
            <div className="spinner" />
          ) : visibleEvents.length === 0 ? (
            <div className="no-events"><p>No events found.</p></div>
          ) : (
            visibleEvents.map((ev, i) => (
              <EventCard
                key={ev.id}
                event={ev}
                index={i}
                onClick={() => viewEvent(ev)}
              />
            ))
          )}
        </div>

        {(remaining > 0 || visibleCount > INITIAL_COUNT) && (
          <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {remaining > 0 && (
              <button className="btn btn-outline" onClick={() => setVisibleCount(n => n + 12)}>
                <i className="ri-arrow-down-line" /> See More Events
                <span style={{ marginLeft: 6, fontSize: '0.85em', opacity: 0.7 }}>
                  ({remaining} more)
                </span>
              </button>
            )}
            {visibleCount > INITIAL_COUNT && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  setVisibleCount(n => Math.max(INITIAL_COUNT, n - 12));
                  requestAnimationFrame(() => {
                    document.getElementById('eventsGrid')
                      ?.scrollIntoView({ behavior: 'instant', block: 'start' });
                  });
                }}
              >
                <i className="ri-arrow-up-line" /> See Less
              </button>
            )}
          </div>
        )}
      </main>

      {/* ── Features ── */}
      <section className="features" aria-labelledby="featuresHeading">
        <div className="features-head">
          <span className="eyebrow">Why Planning Center</span>
          <h2 id="featuresHeading">Everything you need to attend &amp; host events</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue"><i className="ri-calendar-check-line" aria-hidden="true" /></div>
            <h3>Browse &amp; Register</h3>
            <p>Filter events by category and reserve your spot in seconds — no paperwork, no queues.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green"><i className="ri-qr-code-line" aria-hidden="true" /></div>
            <h3>Digital QR Tickets</h3>
            <p>Your scannable ticket lands in your dashboard instantly. Show up, scan, you're in.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple"><i className="ri-line-chart-line" aria-hidden="true" /></div>
            <h3>Real-time Seat Tracking</h3>
            <p>Live capacity updates so organizers never oversell and you always know what's left.</p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials" aria-labelledby="testiHeading">
        <div className="testi-header">
          <span className="testi-eyebrow">Loved by thousands</span>
          <h2 id="testiHeading">What our community says</h2>
        </div>
        <div className="testi-rows" id="testiRows">
          {prefersReducedMotion ? (
            <div className="t-grid">
              {REVIEWS.map(r => <TestiCard key={r.id} r={r} isClone={false} />)}
            </div>
          ) : (
            <>
              <div className="marquee" role="group" aria-label="Customer testimonials, scrolling row 1">
                <div className="marquee-track">
                  {REVIEWS.map(r => <TestiCard key={r.id}          r={r} isClone={false} />)}
                  {REVIEWS.map(r => <TestiCard key={'c1-' + r.id}  r={r} isClone={true}  />)}
                </div>
              </div>
              <div className="marquee reverse" role="group" aria-label="Customer testimonials, scrolling row 2">
                <div className="marquee-track">
                  {[...REVIEWS].reverse().map(r => <TestiCard key={r.id}          r={r} isClone={false} />)}
                  {[...REVIEWS].reverse().map(r => <TestiCard key={'c2-' + r.id}  r={r} isClone={true}  />)}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-top">Planning</span>
              <span className="logo-bottom">Center</span>
            </div>
            <p className="footer-desc">
              Your all-in-one platform to discover, register, and manage events across Cambodia and Southeast Asia.
            </p>
            <div className="footer-socials">
              <a href="#" className="footer-social-btn" aria-label="Facebook"><i className="ri-facebook-fill" /></a>
              <a href="#" className="footer-social-btn" aria-label="Instagram"><i className="ri-instagram-line" /></a>
              <a href="#" className="footer-social-btn" aria-label="Twitter"><i className="ri-twitter-x-line" /></a>
              <a href="#" className="footer-social-btn" aria-label="LinkedIn"><i className="ri-linkedin-fill" /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/"><i className="ri-arrow-right-s-line" /> Home</Link></li>
              <li><Link to="/login"><i className="ri-arrow-right-s-line" /> Sign In</Link></li>
              <li><Link to="/register"><i className="ri-arrow-right-s-line" /> Create Account</Link></li>
              <li><Link to="/events"><i className="ri-arrow-right-s-line" /> Browse Events</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Categories</h4>
            <ul className="footer-links">
              {['Technology','Business','Education','Sports','Entertainment'].map(cat => (
                <li key={cat}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, textAlign: 'left' }}
                    onClick={() => { handleCategoryFilter(cat); document.getElementById('eventsGrid')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    <i className="ri-arrow-right-s-line" /> {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-links">
              <li><i className="ri-map-pin-line" /> Russian Federation Blvd, Phnom Penh, Cambodia</li>
              <li><i className="ri-phone-line" /> +855 23 123 456</li>
              <li><i className="ri-mail-line" /> support@planningcenter.com</li>
              <li><i className="ri-time-line" /> Mon – Fri, 8:00 AM – 5:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Planning Center. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>

      {/* ── Scroll-to-top button ── */}
      {showScrollTop && (
        <button
          className="scroll-top-btn visible"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="ri-arrow-up-line" />
        </button>
      )}
    </>
  );
}

// ── Suggestion builder (extracted to avoid re-declaring in component) ─────────
function buildSuggestions(query, events) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const seen = new Set();
  const out  = [];
  events.forEach(e => {
    const key = 'c:' + (e.category || '').toLowerCase();
    if ((e.category || '').toLowerCase().includes(q) && !seen.has(key)) {
      seen.add(key);
      out.push({ type: 'Category', text: e.category, icon: 'ri-price-tag-3-line' });
    }
  });
  events.forEach(e => {
    const key = 't:' + e.id;
    if ((e.title || '').toLowerCase().includes(q) && !seen.has(key)) {
      seen.add(key);
      out.push({ type: 'Event', text: e.title, icon: 'ri-calendar-event-line' });
    }
  });
  return out.slice(0, 7);
}

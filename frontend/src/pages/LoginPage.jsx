import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiLogin } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../../assets/css/9_auth-gm.css';
import './LoginPage.css';

const ROLE_ROUTES = {
  Supervisor: '/superadmin',
  Admin:      '/admin',
  Organizer:  '/organizer',
  Attendee:   '/dashboard',
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shake(fieldEl) {
  if (!fieldEl) return;
  fieldEl.classList.remove('shaking');
  void fieldEl.offsetWidth; // force reflow so animation replays
  fieldEl.classList.add('shaking');
}

export default function LoginPage() {
  const navigate     = useNavigate();
  const { syncSession } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const emailFieldRef = useRef(null);
  const pwFieldRef    = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    const role = localStorage.getItem('erms_role');
    if (role) navigate(ROLE_ROUTES[role] || '/', { replace: true });
  }, [navigate]);

  // ── Per-field validation ──────────────────────────────────────────────────
  function validate(name, value) {
    if (name === 'email') {
      if (!value.trim())           return 'Email is required.';
      if (!emailRe.test(value))    return 'Enter a valid email address.';
    }
    if (name === 'pw') {
      if (!value) return 'Password is required.';
    }
    return '';
  }

  function handleBlur(name, value) {
    setTouched(t => ({ ...t, [name]: true }));
    const err = validate(name, value);
    setErrors(e => ({ ...e, [name]: err }));
    if (err) {
      shake(name === 'email' ? emailFieldRef.current : pwFieldRef.current);
    }
  }

  function handleChange(name, value) {
    if (name === 'email') setEmail(value);
    else setPassword(value);
    if (touched[name]) {
      setErrors(e => ({ ...e, [name]: validate(name, value) }));
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || success) return;

    const emailErr = validate('email', email);
    const pwErr    = validate('pw', password);
    setTouched({ email: true, pw: true });
    setErrors({ email: emailErr, pw: pwErr });

    if (emailErr) { shake(emailFieldRef.current); return; }
    if (pwErr)    { shake(pwFieldRef.current);    return; }

    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      syncSession();
      setSuccess(true);
      setTimeout(() => navigate(ROLE_ROUTES[data.user.role] || '/'), 650);
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.toLowerCase().includes('password')) {
        setErrors({ pw: msg });
        shake(pwFieldRef.current);
      } else {
        setErrors({ email: msg });
        shake(emailFieldRef.current);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Field class helper ────────────────────────────────────────────────────
  function fieldCls(name, value) {
    const err = errors[name];
    const hasVal = value.trim() !== '';
    if (err && touched[name])       return 'field invalid';
    if (!err && hasVal && touched[name]) return 'field valid';
    return 'field';
  }

  return (
    <>
      {/* Glass header */}
      <header className="gm-header">
        <Link className="gm-logo" to="/" aria-label="Planning Center home">
          <span className="t">Planning</span>
          <span className="b">Center</span>
        </Link>
        <div className="gm-actions">
          <Link to="/register" className="gm-btn ghost">Sign up</Link>
          <button className="gm-btn solid" aria-current="page">Sign in</button>
        </div>
      </header>

      <main className="gm-main">
        <div className="card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to your Planning Center account</p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className={fieldCls('email', email)} ref={emailFieldRef}>
              <input
                type="email"
                id="loginEmail"
                placeholder=" "
                autoComplete="email"
                value={email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={e  => handleBlur('email', e.target.value)}
                required
              />
              <label htmlFor="loginEmail">Email address</label>
              <i className="ri-check-line valid-tick" aria-hidden="true" />
              <div className="field-error" role="alert">{errors.email}</div>
            </div>

            {/* Password */}
            <div className={fieldCls('pw', password)} ref={pwFieldRef}>
              <input
                type={showPw ? 'text' : 'password'}
                id="loginPassword"
                placeholder=" "
                autoComplete="current-password"
                value={password}
                onChange={e => handleChange('pw', e.target.value)}
                onBlur={e  => handleBlur('pw', e.target.value)}
                required
              />
              <label htmlFor="loginPassword">Password</label>
              <button
                type="button"
                className="pw-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(v => !v)}
              >
                <i className={showPw ? 'ri-eye-off-line' : 'ri-eye-line'} aria-hidden="true" />
              </button>
              <div className="field-error" role="alert">{errors.pw}</div>
            </div>

            <div className="auth-row">
              <label className="remember">
                <input type="checkbox" id="rememberMe" /> Remember me
              </label>
              <Link className="forgot" to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className={`cta${loading ? ' loading' : ''}${success ? ' success' : ''}`}
              id="ctaBtn"
              disabled={loading || success}
            >
              <span className="spinner" aria-hidden="true" />
              <span className="label">Sign in</span>
              <span className="check" aria-hidden="true"><i className="ri-check-line" /></span>
            </button>
          </form>

          <p className="foot">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>

        {/* Feature strip */}
        <section className="login-features" aria-label="Platform features">
          <div className="lf-grid">
            <div className="lf-card">
              <div className="lf-icon blue"><i className="ri-calendar-event-line" aria-hidden="true" /></div>
              <div className="lf-title">Browse &amp; Register for Events</div>
            </div>
            <div className="lf-card">
              <div className="lf-icon green"><i className="ri-qr-code-line" aria-hidden="true" /></div>
              <div className="lf-title">Digital QR Tickets</div>
            </div>
            <div className="lf-card">
              <div className="lf-icon purple"><i className="ri-dashboard-3-line" aria-hidden="true" /></div>
              <div className="lf-title">Role Dashboards</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

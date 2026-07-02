import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRegister, apiVerifyEmail, apiResendOtp } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../../assets/css/9_auth-gm.css';
import './RegisterPage.css';

const ROLE_ROUTES = {
  Supervisor: '/superadmin',
  Admin:      '/admin',
  Organizer:  '/organizer',
  Attendee:   '/dashboard',
};

const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneOk  = (v) => {
  const c = v.replace(/[\s\-\+]/g, '');
  const l = c.startsWith('855') ? c.slice(3) : c;
  return /^[0-9]{8,11}$/.test(l);
};

function shake(el) {
  if (!el) return;
  el.classList.remove('shaking');
  void el.offsetWidth;
  el.classList.add('shaking');
}

function pwStrength(pw) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8)                          s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw))   s++;
  if (/\d/.test(pw))                           s++;
  if (/[^A-Za-z0-9]/.test(pw))                s++;
  if (pw.length < 8 || s <= 2) return { cls: 'weak',   label: 'Weak' };
  if (s === 3)                  return { cls: 'medium', label: 'Medium' };
  return { cls: 'strong', label: 'Strong' };
}

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const colors = ['#F59E0B','#FB923C','#1E3A5F','#FDE68A','#16A34A'];
  const parts = Array.from({ length: 140 }, (_, i) => ({
    x: window.innerWidth / 2, y: window.innerHeight * 0.4,
    vx: (Math.random() - 0.5) * 12, vy: Math.random() * -12 - 4,
    g: 0.35 + Math.random() * 0.2,  s: 5 + Math.random() * 6,
    rot: Math.random() * 6.28,      vr: (Math.random() - 0.5) * 0.4,
    col: colors[(i * 7) % colors.length],
  }));
  const start = performance.now();
  function frame(t) {
    const dt = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - dt / 1500);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    });
    if (dt < 1500) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

export default function RegisterPage() {
  const navigate        = useNavigate();
  const { syncSession } = useAuth();

  // ── step: 'form' | 'verify' ──────────────────────────────────────────────
  const [step, setStep] = useState('form');

  // ── form fields ──────────────────────────────────────────────────────────
  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [address,         setAddress]         = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted,   setTermsAccepted]   = useState(false);
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);

  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // ── verify card ──────────────────────────────────────────────────────────
  const [userId,          setUserId]          = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifyCode,      setVerifyCode]      = useState('');
  const [verifyError,     setVerifyError]     = useState('');
  const [verifyLoading,   setVerifyLoading]   = useState(false);
  const [verifySuccess,   setVerifySuccess]   = useState(false);
  const [resendSecs,      setResendSecs]      = useState(0);

  // ── field refs for shake ─────────────────────────────────────────────────
  const firstRef   = useRef(null);
  const lastRef    = useRef(null);
  const emailRef   = useRef(null);
  const phoneRef   = useRef(null);
  const pwRef      = useRef(null);
  const confirmRef = useRef(null);

  const fieldRefs = { first: firstRef, last: lastRef, email: emailRef,
                      phone: phoneRef,  pw: pwRef,     confirm: confirmRef };

  // ── redirect if already logged in ────────────────────────────────────────
  useEffect(() => {
    const role = localStorage.getItem('erms_role');
    if (role) navigate(ROLE_ROUTES[role] || '/', { replace: true });
  }, [navigate]);

  // ── resend countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setTimeout(() => setResendSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSecs]);

  // ── validation ───────────────────────────────────────────────────────────
  function validate(name, vals) {
    const v = vals || {
      first: firstName, last: lastName, email, phone,
      pw: password, confirm: confirmPassword,
    };
    switch (name) {
      case 'first':   return v.first.trim()  ? '' : 'First name is required.';
      case 'last':    return v.last.trim()   ? '' : 'Last name is required.';
      case 'email':
        if (!v.email.trim()) return 'Email is required.';
        return emailRe.test(v.email) ? '' : 'Enter a valid email address.';
      case 'phone':
        if (!v.phone.trim()) return 'Phone number is required.';
        return phoneOk(v.phone) ? '' : 'Enter a valid phone number.';
      case 'pw':
        return v.pw.length >= 8 ? '' : 'Password must be at least 8 characters.';
      case 'confirm':
        if (!v.confirm) return 'Please confirm your password.';
        return v.confirm === v.pw ? '' : 'Passwords do not match.';
      default: return '';
    }
  }

  function handleBlur(name) {
    setTouched(t => ({ ...t, [name]: true }));
    const err = validate(name);
    setErrors(e => ({ ...e, [name]: err }));
    if (err) shake(fieldRefs[name]?.current);
  }

  function handleChange(name, value) {
    const setters = {
      first: setFirstName, last: setLastName, email: setEmail,
      phone: setPhone, pw: setPassword, confirm: setConfirmPassword,
    };
    setters[name]?.(value);
    if (touched[name]) {
      const vals = {
        first: firstName, last: lastName, email, phone,
        pw: password, confirm: confirmPassword,
        [name]: value,
      };
      const err = validate(name, vals);
      setErrors(e => ({ ...e, [name]: err }));
      // re-validate confirm when pw changes
      if (name === 'pw' && touched.confirm) {
        const cErr = validate('confirm', { ...vals, pw: value });
        setErrors(e => ({ ...e, confirm: cErr }));
      }
    }
  }

  function fieldCls(name, value) {
    const err = errors[name];
    const hasVal = String(value).trim() !== '';
    if (err && touched[name])              return 'field invalid';
    if (!err && hasVal && touched[name])   return 'field valid';
    return 'field';
  }

  const strength = pwStrength(password);

  // ── submit registration ───────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const names = ['first','last','email','phone','pw','confirm'];
    const newTouched = Object.fromEntries(names.map(n => [n, true]));
    const newErrors  = Object.fromEntries(names.map(n => [n, validate(n)]));
    setTouched(t => ({ ...t, ...newTouched }));
    setErrors(newErrors);

    const termsErr = termsAccepted ? '' : 'You must agree to the Terms & Conditions to continue.';
    setErrors(e => ({ ...e, terms: termsErr }));

    const firstBad = names.find(n => newErrors[n]);
    if (firstBad) { shake(fieldRefs[firstBad]?.current); return; }
    if (!termsAccepted) return;

    setLoading(true);
    try {
      const data = await apiRegister({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        phone:     phone.trim(),
        address:   address.trim() || undefined,
        password,
      });
      setUserId(data.user_id);
      setRegisteredEmail(data.email);
      setStep('verify');
      setResendSecs(60);
    } catch (err) {
      const msg = err.message || String(err);
      setErrors(e => ({ ...e, email: msg }));
      shake(emailRef.current);
    } finally {
      setLoading(false);
    }
  }

  // ── verify email ──────────────────────────────────────────────────────────
  async function handleVerify() {
    if (verifyLoading || verifySuccess) return;
    setVerifyError('');
    if (!/^\d{6}$/.test(verifyCode.trim())) {
      setVerifyError('Enter the 6-digit code from your email.');
      return;
    }
    setVerifyLoading(true);
    try {
      await apiVerifyEmail(userId, verifyCode.trim());
      syncSession();
      setVerifySuccess(true);
      launchConfetti();
      const role = localStorage.getItem('erms_role');
      setTimeout(() => navigate(ROLE_ROUTES[role] || '/'), 1200);
    } catch (err) {
      setVerifyError(err.message || String(err));
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResend() {
    if (resendSecs > 0) return;
    setVerifyError('');
    try {
      await apiResendOtp(userId);
      setResendSecs(60);
    } catch (err) {
      setVerifyError(err.message || String(err));
    }
  }

  function socialComingSoon(name) {
    alert(`${name} sign-up is coming soon!`);
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <header className="gm-header">
        <Link className="gm-logo" to="/" aria-label="Planning Center home">
          <span className="t">Planning</span>
          <span className="b">Center</span>
        </Link>
        <div className="gm-actions">
          <Link to="/login" className="gm-btn ghost">Sign in</Link>
          <button className="gm-btn solid" aria-current="page">Sign up</button>
        </div>
      </header>

      <main className="gm-main">

        {/* ── Registration form card ── */}
        {step === 'form' && (
          <div className="card">
            <h1>Create account</h1>
            <p className="sub">Join Planning Center to register for events</p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Name row */}
              <div className="name-row">
                <div className={fieldCls('first', firstName)} ref={firstRef}>
                  <input type="text" id="regFirstName" placeholder=" "
                    autoComplete="given-name" value={firstName}
                    onChange={e => handleChange('first', e.target.value)}
                    onBlur={() => handleBlur('first')} required />
                  <label htmlFor="regFirstName">First name</label>
                  <i className="ri-check-line valid-tick" aria-hidden="true" />
                  <div className="field-error" role="alert">{errors.first}</div>
                </div>
                <div className={fieldCls('last', lastName)} ref={lastRef}>
                  <input type="text" id="regLastName" placeholder=" "
                    autoComplete="family-name" value={lastName}
                    onChange={e => handleChange('last', e.target.value)}
                    onBlur={() => handleBlur('last')} required />
                  <label htmlFor="regLastName">Last name</label>
                  <i className="ri-check-line valid-tick" aria-hidden="true" />
                  <div className="field-error" role="alert">{errors.last}</div>
                </div>
              </div>

              {/* Email */}
              <div className={fieldCls('email', email)} ref={emailRef}>
                <input type="email" id="regEmail" placeholder=" "
                  autoComplete="email" value={email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')} required />
                <label htmlFor="regEmail">Email address</label>
                <i className="ri-check-line valid-tick" aria-hidden="true" />
                <div className="field-error" role="alert">{errors.email}</div>
              </div>

              {/* Phone */}
              <div className={fieldCls('phone', phone)} ref={phoneRef}>
                <input type="tel" id="regPhone" placeholder=" "
                  autoComplete="tel" value={phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')} required />
                <label htmlFor="regPhone">Phone number</label>
                <i className="ri-check-line valid-tick" aria-hidden="true" />
                <div className="field-error" role="alert">{errors.phone}</div>
              </div>

              {/* Address (optional) */}
              <div className="field">
                <input type="text" id="regAddress" placeholder=" "
                  autoComplete="street-address" value={address}
                  onChange={e => setAddress(e.target.value)} />
                <label htmlFor="regAddress">Address (optional)</label>
              </div>

              {/* Password */}
              <div className={fieldCls('pw', password)} ref={pwRef}>
                <input type={showPw ? 'text' : 'password'} id="regPassword" placeholder=" "
                  autoComplete="new-password" value={password}
                  onChange={e => handleChange('pw', e.target.value)}
                  onBlur={() => handleBlur('pw')} required />
                <label htmlFor="regPassword">Password</label>
                <button type="button" className="pw-toggle"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(v => !v)}>
                  <i className={showPw ? 'ri-eye-off-line' : 'ri-eye-line'} aria-hidden="true" />
                </button>
                <div className="field-error" role="alert">{errors.pw}</div>
              </div>

              {/* Password strength */}
              <div className={`pw-strength${strength ? ` show ${strength.cls}` : ''}`} aria-live="polite">
                <div className="pw-bars"><span /><span /><span /></div>
                <span className="pw-label">{strength?.label || ''}</span>
              </div>

              {/* Confirm password */}
              <div className={fieldCls('confirm', confirmPassword)} ref={confirmRef}>
                <input type={showConfirmPw ? 'text' : 'password'} id="regConfirmPassword" placeholder=" "
                  autoComplete="new-password" value={confirmPassword}
                  onChange={e => handleChange('confirm', e.target.value)}
                  onBlur={() => handleBlur('confirm')} required />
                <label htmlFor="regConfirmPassword">Confirm password</label>
                <button type="button" className="pw-toggle"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPw(v => !v)}>
                  <i className={showConfirmPw ? 'ri-eye-off-line' : 'ri-eye-line'} aria-hidden="true" />
                </button>
                <div className="field-error" role="alert">{errors.confirm}</div>
              </div>

              {/* Terms */}
              <label className="terms-row" htmlFor="regTerms">
                <input type="checkbox" id="regTerms" checked={termsAccepted}
                  onChange={e => { setTermsAccepted(e.target.checked); if (e.target.checked) setErrors(er => ({ ...er, terms: '' })); }} />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className="terms-link" target="_blank">Terms &amp; Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="terms-link" target="_blank">Privacy Policy</Link>
                </span>
              </label>
              <div className="field-error terms-error" role="alert">{errors.terms}</div>

              <button type="submit"
                className={`cta${loading ? ' loading' : ''}`}
                disabled={loading}>
                <span className="spinner" aria-hidden="true" />
                <span className="label">Create account</span>
                <span className="check" aria-hidden="true"><i className="ri-check-line" /></span>
              </button>
            </form>

            <div className="divider-or"><span>or sign up with</span></div>

            <div className="social-row">
              <button className="social-btn" aria-label="Sign up with Google"
                onClick={() => socialComingSoon('Google')}>
                <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google
              </button>
              <button className="social-btn" aria-label="Sign up with Facebook"
                onClick={() => socialComingSoon('Facebook')}>
                <i className="ri-facebook-fill" style={{ color: '#1877F2', fontSize: 18 }} aria-hidden="true" />
                Facebook
              </button>
              <button className="social-btn" aria-label="Sign up with Telegram"
                onClick={() => socialComingSoon('Telegram')}>
                <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
                  <circle cx="24" cy="24" r="24" fill="#2AABEE"/>
                  <path fill="#fff" d="M35.5 13.3L8.9 23.6c-1.5.6-1.5 1.4-.3 1.8l6.7 2.1 15.5-9.8c.7-.4 1.4-.2.9.3L18.2 29.2l-.6 7c.8 0 1.2-.4 1.6-.8l3.8-3.7 7 5.2c1.3.7 2.2.3 2.5-1.2l4.5-21.2c.5-1.9-.7-2.8-1.5-2.2z"/>
                </svg>
                Telegram
              </button>
            </div>

            <p className="foot">Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        )}

        {/* ── Email verification card ── */}
        {step === 'verify' && (
          <div className="card verify-card">
            <div className="verify-icon">
              <i className="ri-mail-check-line" />
            </div>
            <h1>Check your email</h1>
            <p className="sub">
              We sent a 6-digit code to <strong>{registeredEmail}</strong>
            </p>

            <div className="field" style={{ marginTop: 24 }}>
              <input
                type="text"
                id="verifyCode"
                placeholder=" "
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verifyCode}
                style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center' }}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                autoFocus
              />
              <label htmlFor="verifyCode">Verification code</label>
              <div className="field-error" role="alert">{verifyError}</div>
            </div>

            <button
              className={`cta${verifyLoading ? ' loading' : ''}${verifySuccess ? ' success' : ''}`}
              onClick={handleVerify}
              disabled={verifyLoading || verifySuccess}
            >
              <span className="spinner" aria-hidden="true" />
              <span className="label">Verify email</span>
              <span className="check" aria-hidden="true"><i className="ri-check-line" /></span>
            </button>

            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-light)' }}>
              Didn't get it?{' '}
              <button
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: resendSecs > 0 ? 'default' : 'pointer',
                  color: 'var(--primary)', fontWeight: 600, fontSize: 'inherit',
                  opacity: resendSecs > 0 ? 0.4 : 1, pointerEvents: resendSecs > 0 ? 'none' : 'auto',
                }}
                onClick={handleResend}
              >
                Resend code
              </button>
              {resendSecs > 0 && <span> ({resendSecs}s)</span>}
            </p>
          </div>
        )}

      </main>
    </>
  );
}

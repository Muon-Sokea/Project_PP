import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiGetEventById } from '../../services/event.service.js';
import { apiRegisterForEvent } from '../../services/registration.service.js';
import { useScrollListener } from '../../hooks/useScrollListener.js';
import '../../../assets/css/1_global.css';
import '../../../assets/css/2_navbar.css';
import './EventRegistrationPage.css';

const ROLE_ROUTES = {
  Supervisor: '/superadmin', Admin: '/admin',
  Organizer:  '/organizer',  Attendee: '/dashboard',
};

function formatCardNumber(val) {
  return val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val) {
  const v = val.replace(/\D/g, '').substring(0, 4);
  return v.length >= 2 ? v.substring(0, 2) + '/' + v.substring(2) : v;
}

export default function EventRegistrationPage() {
  const navigate      = useNavigate();
  const { user, role, logout } = useAuth();

  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  // Ticket selection — real tiers from the event, or a single flat price if none configured
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [qty, setQty] = useState(1);

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');
  const [city,      setCity]      = useState('');
  const [zip,       setZip]       = useState('');

  // Payment
  const [cardName,   setCardName]   = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV,    setCardCVV]    = useState('');

  // Promo code
  const [promoInput,   setPromoInput]   = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError,   setPromoError]   = useState('');

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [navOpen,    setNavOpen]    = useState(false);
  const navScrolled = useScrollListener();

  // ── Init — always fetch the live event so price/tiers/seats are current ──
  useEffect(() => {
    const cached = (() => { try { return JSON.parse(localStorage.getItem('erms_selected_event') || 'null'); } catch { return null; } })();
    if (!cached?.id) { setLoadErr('No event selected.'); setLoading(false); return; }

    apiGetEventById(cached.id)
      .then(ev => {
        setEvent(ev);
        if (ev.ticketTypes?.length) setSelectedTierId(ev.ticketTypes[0].id);
      })
      .catch(() => setLoadErr('Could not load this event. It may have been removed.'))
      .finally(() => setLoading(false));

    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName   || '');
      setEmail(user.email         || '');
    }
  }, [user]);

  const tiers = event?.ticketTypes || [];
  const hasTiers = tiers.length > 0;
  const selectedTier = hasTiers ? tiers.find(t => t.id === selectedTierId) : null;
  const unitPrice = hasTiers ? Number(selectedTier?.price || 0) : Number(event?.price || 0);
  const seatsLeftForTier = selectedTier ? Math.max(0, selectedTier.quantity - (selectedTier.sold || 0)) : null;
  const subtotal = unitPrice * qty;
  const discountPct = promoApplied ? Number(event?.promoDiscountPercent || 0) : 0;
  const total = subtotal * (1 - discountPct / 100);

  function applyPromoCode() {
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (!event?.promoCode || !event?.promoDiscountPercent || code !== event.promoCode) {
      setPromoApplied(false);
      setPromoError('Invalid or expired promo code.');
      return;
    }
    setPromoApplied(true);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const required = [firstName, lastName, email, phone, address, city, cardName, cardNumber, cardExpiry, cardCVV];
    if (required.some(v => !v.trim())) { setError('Please fill in all required fields.'); return; }
    if (hasTiers && !selectedTierId) { setError('Please select a ticket type.'); return; }

    if (!user) { navigate('/login'); return; }

    setSubmitting(true);
    try {
      const ticket = await apiRegisterForEvent(event.id, {
        ticketTypeId: hasTiers ? selectedTierId : undefined,
        quantity: qty,
        promoCode: promoApplied ? event.promoCode : undefined,
      });

      localStorage.setItem('erms_from_payment', 'true');
      localStorage.setItem('erms_ticket_code',  ticket.ticket_code || ticket.id);
      localStorage.setItem('erms_ticket_type', ticket.ticket_type || '');
      // Store the full event object so TicketPage has date/time/location
      localStorage.setItem('erms_ticket_event', JSON.stringify(event || { title: event?.title || 'Event' }));
      // Notify other pages (e.g. homepage) that a registration happened
      window.dispatchEvent(new CustomEvent('erms:registration-updated'));
      navigate('/ticket');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const ticketLabel = (hasTiers ? (selectedTier?.name || 'Ticket') : 'General Admission') + ` × ${qty}`;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  }

  if (loadErr || !event) {
    return (
      <>
        <nav className="navbar">
          <Link className="nav-logo" to="/"><span className="logo-top">Planning</span><span className="logo-bottom">Center</span></Link>
        </nav>
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2>Can't complete registration</h2>
          <p style={{ color: 'var(--text-medium)', margin: '12px 0 24px' }}>{loadErr}</p>
          <Link to="/" className="btn btn-primary"><i className="ri-arrow-left-line" /> Back to Events</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
        <Link className="nav-logo" to="/"><span className="logo-top">Planning</span><span className="logo-bottom">Center</span></Link>
        <button className="hamburger" onClick={() => setNavOpen(o => !o)}><span /><span /><span /></button>
        <div className={`nav-links${navOpen ? ' open' : ''}`}>
          <Link to="/" className="btn btn-primary"><i className="ri-home-line" /> Home</Link>
          {user
            ? <button className="btn btn-outline" onClick={() => navigate(ROLE_ROUTES[role] || '/')}><i className="ri-dashboard-line" /> Dashboard</button>
            : <Link to="/login" className="btn btn-outline"><i className="ri-login-box-line" /> Login</Link>}
          {user && <button className="btn btn-outline" onClick={logout}><i className="ri-logout-box-r-line" /> Logout</button>}
        </div>
      </nav>

      <main className="reg-page">
        <h1 className="reg-title">Event Registration</h1>
        <p className="reg-sub">{event ? `Complete your registration for ${event.title}` : 'Complete your registration for the event'}</p>

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Ticket Selection ── */}
          <div className="form-section">
            <div className="form-section-title"><i className="ri-coupon-3-line" /> Select Tickets</div>

            {hasTiers ? tiers.map(tier => {
              const left = Math.max(0, tier.quantity - (tier.sold || 0));
              const soldOut = left <= 0;
              return (
                <div
                  key={tier.id}
                  className={`ticket-option${selectedTierId === tier.id ? ' selected' : ''}`}
                  style={soldOut ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
                  onClick={() => !soldOut && setSelectedTierId(tier.id)}
                >
                  <div className="ticket-info">
                    <div className="t-name">{tier.name}</div>
                    <div className="t-desc">{tier.description || (soldOut ? 'Sold out' : `${left} left`)}</div>
                  </div>
                  <div className="t-price">${Number(tier.price).toFixed(2)}</div>
                </div>
              );
            }) : (
              <div className="ticket-option selected">
                <div className="ticket-info">
                  <div className="t-name">General Admission</div>
                  <div className="t-desc">Access to the event</div>
                </div>
                <div className="t-price">${unitPrice.toFixed(2)}</div>
              </div>
            )}

            <div className="qty-row">
              <span className="q-label">Quantity</span>
              <div className="qty-controls">
                <button type="button" className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span className="qty-val">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty(q => Math.min(seatsLeftForTier ?? 10, q + 1))}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <div className="form-section">
            <div className="form-section-title"><i className="ri-user-3-line" /> Personal Information</div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="Enter your first name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Last Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="Enter your last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="tel" placeholder="Enter your phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Address <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" placeholder="Enter your address" value={address} onChange={e => setAddress(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="Enter your city" value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input type="text" placeholder="Enter your ZIP code" value={zip} onChange={e => setZip(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Payment Information ── */}
          <div className="form-section">
            <div className="form-section-title"><i className="ri-bank-card-line" /> Payment Information</div>
            <div className="form-group">
              <label>Cardholder Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" placeholder="Enter your cardholder name" value={cardName} onChange={e => setCardName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Card Number <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text" placeholder="Enter your card number" maxLength={19}
                value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" placeholder="MM/YY" maxLength={5}
                  value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} required
                />
              </div>
              <div className="form-group">
                <label>CVV <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="CVV" maxLength={3} value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/g, ''))} required />
              </div>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="order-summary">
            <div className="form-section-title" style={{ marginBottom: '12px' }}>
              <i className="ri-file-list-3-line" /> Order Summary
            </div>
            <div className="order-row">
              <span>{ticketLabel}</span>
              <span style={{ color: 'var(--primary)' }}>${subtotal.toFixed(2)}</span>
            </div>

            {event.promoCode && event.promoDiscountPercent > 0 && (
              <div style={{ margin: '10px 0' }}>
                {promoApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--ok, #16a34a)' }}>
                    <span><i className="ri-checkbox-circle-fill" /> Code "{event.promoCode}" applied — {event.promoDiscountPercent}% off</span>
                    <button type="button" onClick={() => { setPromoApplied(false); setPromoInput(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text" placeholder="Promo code" value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={applyPromoCode}>Apply</button>
                  </div>
                )}
                {promoError && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{promoError}</div>}
              </div>
            )}

            {promoApplied && (
              <div className="order-row">
                <span>Discount ({discountPct}%)</span>
                <span style={{ color: 'var(--ok, #16a34a)' }}>-${(subtotal - total).toFixed(2)}</span>
              </div>
            )}

            <div className="order-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, maxWidth: '380px' }} disabled={submitting}>
              {submitting ? 'Processing…' : 'Complete Registration & Payment'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

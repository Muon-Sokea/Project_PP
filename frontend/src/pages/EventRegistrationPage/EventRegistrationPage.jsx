import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRegisterForEvent } from '../../services/registration.service.js';
import { useScrollListener } from '../../hooks/useScrollListener.js';
import '../../../assets/css/1_global.css';
import '../../../assets/css/2_navbar.css';
import './EventRegistrationPage.css';

const PROCESSING_FEE = 5;
const PROMO_CODES = { EARLY20: 0.20, SAVE10: 0.10, VIP50: 0.50 };

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

  const [event, setEvent] = useState(null);

  // Ticket selection
  const [selectedType,  setSelectedType]  = useState('general');
  const [baseGen,       setBaseGen]       = useState(250);
  const [baseVip,       setBaseVip]       = useState(450);
  const [qty,           setQty]           = useState(1);
  const [discount,      setDiscount]      = useState(0);
  const [promoInput,    setPromoInput]    = useState('');
  const [promoMsg,      setPromoMsg]      = useState({ text: '', color: '' });

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

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [navOpen,    setNavOpen]    = useState(false);
  const navScrolled = useScrollListener();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ev = (() => { try { return JSON.parse(localStorage.getItem('erms_selected_event') || 'null'); } catch { return null; } })();
    if (ev) {
      setEvent(ev);
      const gen = ev.price != null ? Number(ev.price) : 250;
      const vip = gen === 0 ? 0 : Math.round(gen * 1.8);
      setBaseGen(gen);
      setBaseVip(vip);
    }
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName   || '');
      setEmail(user.email         || '');
    }
    /* scroll listener handled by useScrollListener() */
  }, [user]);

  // ── Computed totals ───────────────────────────────────────────────────────
  const selectedPrice = selectedType === 'general' ? baseGen : baseVip;
  const subtotal      = selectedPrice * qty;
  const discountAmt   = subtotal * discount;
  const processingFee = subtotal === 0 ? 0 : PROCESSING_FEE;
  const total         = subtotal - discountAmt + processingFee;

  // ── Promo ─────────────────────────────────────────────────────────────────
  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoMsg({ text: 'Please enter a promo code', color: 'var(--warning)' }); return; }
    if (PROMO_CODES[code] !== undefined) {
      setDiscount(PROMO_CODES[code]);
      setPromoMsg({ text: `${PROMO_CODES[code] * 100}% off applied`, color: 'var(--success)' });
    } else {
      setDiscount(0);
      setPromoMsg({ text: 'Invalid promo code', color: 'var(--danger)' });
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const required = [firstName, lastName, email, phone, address, city, cardName, cardNumber, cardExpiry, cardCVV];
    if (required.some(v => !v.trim())) { setError('Please fill in all required fields.'); return; }

    if (!user) { navigate('/login'); return; }

    setSubmitting(true);
    try {
      const ticketType = selectedType === 'general' ? 'General Admission' : 'VIP Pass';
      let ticket;
      try {
        ticket = await apiRegisterForEvent(event?.id, {
          ticketType, quantity: qty, price: total.toFixed(2),
        });
      } catch (apiErr) {
        // Fallback: write to localStorage directly (same pattern as original HTML)
        const ticketCode = 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const txnRef     = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        ticket = {
          id: Date.now(), userId: user.id,
          eventId: event?.id, event_title: event?.title || 'Event',
          ticketCode, ticket_type: ticketType, quantity: qty,
          unit_price: selectedPrice, total_amount: total.toFixed(2),
          payment_method: 'card', payment_status: 'paid',
          transaction_reference: txnRef,
          attendee_name: `${firstName} ${lastName}`.trim(),
          attendee_email: email,
          status: 'confirmed', registered_at: new Date().toISOString(),
        };
        const tickets = (() => { try { return JSON.parse(localStorage.getItem('erms_tickets') || '[]'); } catch { return []; } })();
        tickets.push(ticket);
        localStorage.setItem('erms_tickets', JSON.stringify(tickets));
      }

      localStorage.setItem('erms_from_payment', 'true');
      localStorage.setItem('erms_ticket_code',  ticket.ticketCode || ticket.id);
      localStorage.setItem('erms_ticket_type', ticketType);
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

  const ticketLabel = (selectedType === 'general' ? 'General Admission' : 'VIP Pass') + ` × ${qty}`;

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

        {error && <div className="alert alert-error" style={{ marginBottom:'16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Ticket Selection ── */}
          <div className="form-section">
            <div className="form-section-title"><i className="ri-coupon-3-line" /> Select Tickets</div>
            <div
              className={`ticket-option${selectedType === 'general' ? ' selected' : ''}`}
              onClick={() => { setSelectedType('general'); setDiscount(0); setPromoInput(''); setPromoMsg({ text:'', color:'' }); }}
            >
              <div className="ticket-info">
                <div className="t-name">General Admission</div>
                <div className="t-desc">Access to all keynotes &amp; workshops</div>
              </div>
              <div className="t-price">${baseGen}</div>
            </div>
            <div
              className={`ticket-option${selectedType === 'vip' ? ' selected' : ''}`}
              onClick={() => { setSelectedType('vip'); setDiscount(0); setPromoInput(''); setPromoMsg({ text:'', color:'' }); }}
            >
              <div className="ticket-info">
                <div className="t-name">VIP Pass</div>
                <div className="t-desc">+ Exclusive lounge &amp; speaker dinner</div>
              </div>
              <div className="t-price">${baseVip}</div>
            </div>

            <div className="qty-row">
              <span className="q-label">Quantity</span>
              <div className="qty-controls">
                <button type="button" className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span className="qty-val">{qty}</span>
                <button type="button" className="qty-btn" onClick={() => setQty(q => Math.min(10, q + 1))} aria-label="Increase quantity">+</button>
              </div>
            </div>

            <div className="promo-row">
              <input
                type="text" placeholder="Promo code (try EARLY20)"
                value={promoInput} onChange={e => setPromoInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
              />
              <button type="button" className="btn btn-outline" onClick={applyPromo}>Apply</button>
            </div>
            {promoMsg.text && <div className="promo-feedback" style={{ color: promoMsg.color }}>{promoMsg.text}</div>}
          </div>

          {/* ── Personal Information ── */}
          <div className="form-section">
            <div className="form-section-title"><i className="ri-user-3-line" /> Personal Information</div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="Enter your first name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Last Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="Enter your last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email <span style={{ color:'var(--danger)' }}>*</span></label>
                <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number <span style={{ color:'var(--danger)' }}>*</span></label>
                <input type="tel" placeholder="Enter your phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Address <span style={{ color:'var(--danger)' }}>*</span></label>
              <input type="text" placeholder="Enter your address" value={address} onChange={e => setAddress(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City <span style={{ color:'var(--danger)' }}>*</span></label>
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
              <label>Cardholder Name <span style={{ color:'var(--danger)' }}>*</span></label>
              <input type="text" placeholder="Enter your cardholder name" value={cardName} onChange={e => setCardName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Card Number <span style={{ color:'var(--danger)' }}>*</span></label>
              <input
                type="text" placeholder="Enter your card number" maxLength={19}
                value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date <span style={{ color:'var(--danger)' }}>*</span></label>
                <input
                  type="text" placeholder="MM/YY" maxLength={5}
                  value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} required
                />
              </div>
              <div className="form-group">
                <label>CVV <span style={{ color:'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="CVV" maxLength={3} value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/g, ''))} required />
              </div>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="order-summary">
            <div className="form-section-title" style={{ marginBottom:'12px' }}>
              <i className="ri-file-list-3-line" /> Order Summary
            </div>
            <div className="order-row">
              <span>{ticketLabel}</span>
              <span style={{ color:'var(--primary)' }}>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="order-row">
                <span>Promo discount</span>
                <span style={{ color:'var(--success)' }}>−${discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="order-row">
              <span>Processing Fee</span>
              <span style={{ color:'var(--primary)' }}>${processingFee}</span>
            </div>
            <div className="order-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex:1, maxWidth:'380px' }} disabled={submitting}>
              {submitting ? 'Processing…' : 'Complete Registration & Payment'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

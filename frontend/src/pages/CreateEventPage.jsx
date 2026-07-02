import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiCreateEvent, apiUpdateEvent } from '../services/api.js';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import './CreateEventPage.css';

const TOTAL_STEPS = 5;

function fmtTime(s, e) {
  const f = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  };
  const a = f(s), b = f(e);
  return a && b ? `${a} - ${b}` : a || 'TBA';
}

function to24(s) {
  const m = (s || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '';
  let h = Number(m[1]) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return String(h).padStart(2, '0') + ':' + m[2];
}

function toDateInput(dateStr) {
  if (!dateStr || dateStr === 'TBA') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEMO_DATA = {
  title: 'Tech Innovation Summit 2026',
  category: 'Technology',
  format: 'In-Person',
  description: 'Join us for the premier technology conference of 2026. Connect with industry leaders, discover cutting-edge innovations, and network with fellow tech enthusiasts from around the world.',
  startDate: '2026-11-15',
  startTime: '09:00',
  endTime: '17:00',
  venueName: 'Sokha Hotel Convention Center',
  venueAddress: '123 Tech Avenue, Prey Veng Province, Cambodia',
};

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [step, setStep]           = useState(1);
  const [editingEvent, setEditing] = useState(null);
  const [imageData, setImageData]  = useState(null);
  const [showModal, setShowModal]  = useState(false);
  const fileInputRef               = useRef(null);

  // Step 1
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [format,      setFormat]      = useState('In-Person');
  const [description, setDescription] = useState('');

  // Step 2
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [startTime,    setStartTime]    = useState('');
  const [endTime,      setEndTime]      = useState('');
  const [venueName,    setVenueName]    = useState('');
  const [venueAddress, setVenueAddress] = useState('');

  // Step 3 — tickets
  const [tickets, setTickets] = useState([
    { name: '', price: '', qty: '', desc: '' },
  ]);

  // Step 4 — agenda
  const [agenda, setAgenda] = useState([
    { time: '', session: '', speaker: '' },
  ]);

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [navOpen,    setNavOpen]    = useState(false);

  // ── Hydrate from edit mode ─────────────────────────────────────────────────
  useEffect(() => {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem('erms_edit_event') || 'null'); } catch {}
    if (!raw) return;
    localStorage.removeItem('erms_edit_event');
    setEditing(raw);

    setTitle(raw.title || '');
    setCategory(raw.category || '');
    setDescription(raw.description || '');
    setVenueName(raw.location || '');
    setStartDate(toDateInput(raw.date));

    if (raw.time && raw.time.includes('-')) {
      const [a, b] = raw.time.split('-');
      setStartTime(to24(a.trim()));
      setEndTime(to24(b.trim()));
    }
    if (raw.image) setImageData(raw.image);
    if (raw.price != null || raw.capacity != null) {
      setTickets([{ name: 'General Admission', price: String(raw.price || ''), qty: String(raw.capacity || ''), desc: '' }]);
    }
  }, []);

  // ── Progress line width ───────────────────────────────────────────────────
  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  // ── Step helpers ──────────────────────────────────────────────────────────
  function buildEvent(status) {
    const d = startDate ? new Date(startDate) : null;
    const dateStr = (d && !isNaN(d.getTime()))
      ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBA';
    let capacity = tickets.reduce((s, t) => s + (Number(t.qty) || 0), 0) || 100;
    const price = Number(tickets[0]?.price) || 0;
    return {
      id:          editingEvent ? editingEvent.id : Date.now(),
      title:       title.trim() || 'Untitled Event',
      category:    category || 'General',
      date:        dateStr,
      time:        fmtTime(startTime, endTime),
      location:    (venueName || venueAddress || 'TBA').trim(),
      image:       imageData || '/images/Tech1.jpg',
      price,
      capacity,
      registered:  editingEvent ? (Number(editingEvent.registered) || 0) : 0,
      status,
      description: description.trim() || 'No description yet.',
    };
  }

  function saveCreatedEvent(ev) {
    const push = (obj) => {
      const list = JSON.parse(localStorage.getItem('erms_created_events') || '[]');
      const i = list.findIndex(e => String(e.id) === String(obj.id));
      if (i !== -1) list[i] = obj; else list.push(obj);
      localStorage.setItem('erms_created_events', JSON.stringify(list));
    };
    try { push(ev); } catch {
      ev.image = '/images/Tech1.jpg';
      try { push(ev); } catch {}
    }
  }

  async function publish() {
    if (!title.trim()) { alert('Please enter an event title before publishing.'); setStep(1); return; }
    setSubmitting(true);
    const ev = buildEvent(editingEvent ? editingEvent.status || 'published' : 'published');
    saveCreatedEvent(ev);
    try {
      if (editingEvent) {
        await apiUpdateEvent(editingEvent.id, ev).catch(() => {});
      } else {
        await apiCreateEvent(ev).catch(() => {});
      }
    } catch {}
    setSubmitting(false);
    setShowModal(true);
  }

  async function saveDraft() {
    if (!title.trim()) { alert('Add an event title first, then save your draft.'); return; }
    const ev = buildEvent('draft');
    saveCreatedEvent(ev);
    await apiCreateEvent(ev).catch(() => {});
    alert('Draft saved to your dashboard.');
    navigate('/organizer');
  }

  function changeStep(dir) {
    if (dir === 1 && step === TOTAL_STEPS) { publish(); return; }
    const next = step + dir;
    if (next < 1 || next > TOTAL_STEPS) return;
    setStep(next);
  }

  // ── Ticket helpers ────────────────────────────────────────────────────────
  function updateTicket(i, field, val) {
    setTickets(ts => ts.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  }
  function addTicket() {
    setTickets(ts => [...ts, { name: '', price: '', qty: '', desc: '' }]);
  }
  function removeTicket(i) {
    if (tickets.length > 1) setTickets(ts => ts.filter((_, idx) => idx !== i));
  }

  // ── Agenda helpers ────────────────────────────────────────────────────────
  function updateAgenda(i, field, val) {
    setAgenda(ag => ag.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  }
  function addAgenda() {
    setAgenda(ag => [...ag, { time: '', session: '', speaker: '' }]);
  }
  function removeAgenda(i) {
    setAgenda(ag => ag.filter((_, idx) => idx !== i));
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  function handleImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setImageData(e.target.result);
    reader.readAsDataURL(file);
  }

  function loadDemo() {
    setTitle(DEMO_DATA.title);
    setCategory(DEMO_DATA.category);
    setFormat(DEMO_DATA.format);
    setDescription(DEMO_DATA.description);
    setStartDate(DEMO_DATA.startDate);
    setStartTime(DEMO_DATA.startTime);
    setEndTime(DEMO_DATA.endTime);
    setVenueName(DEMO_DATA.venueName);
    setVenueAddress(DEMO_DATA.venueAddress);
    setTickets([{ name: 'General Admission', price: '250', qty: '1500', desc: 'Access to all keynotes and workshops' }]);
    setAgenda([{ time: '09:00 AM - 10:30 AM', session: 'Opening Keynote: The Future of AI', speaker: 'Sarah Jenkins, CEO TechCorp' }]);
    alert("Demo data loaded! Click 'Next Step' to explore the rest of the form.");
  }

  const isLastStep  = step === TOTAL_STEPS;
  const publishLabel = editingEvent ? 'Save Changes' : 'Publish Event';

  const stepLabels = ['Basic Info', 'Date & Location', 'Tickets', 'Agenda', 'Review'];

  return (
    <>
      <header className="ce-header">
        <div className="ce-header-left">
          <button className="ce-back-btn" onClick={() => navigate('/organizer')} aria-label="Back">←</button>
          <div className="ce-header-logo">Planning Center</div>
        </div>
        <div className="ce-header-right">
          <button className="btn btn-outline" onClick={loadDemo}>✨ Load Demo Data</button>
          <button className="btn btn-outline" onClick={saveDraft}>Save Draft</button>
          {user && (
            <div className="avatar-circle" style={{ width: 36, height: 36, cursor: 'pointer' }}
              onClick={() => { logout(); navigate('/login'); }}>
              {(user.firstName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      <div className="ce-page">
        {/* Progress */}
        <div className="ce-progress">
          <div className="ce-progress-line" style={{ width: `${progressPct}%` }} />
          {stepLabels.map((label, i) => {
            const n = i + 1;
            return (
              <div key={n} className={`ce-step${step === n ? ' active' : step > n ? ' completed' : ''}`}>
                <div className="ce-step-circle">{step > n ? '✓' : n}</div>
                <div className="ce-step-label">{label}</div>
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div className="ce-card">
            <h1 className="ce-section-title">Basic Information</h1>
            <p className="ce-section-sub">Tell attendees what your event is about</p>
            <div className="form-group">
              <label>Event Title</label>
              <input type="text" placeholder="e.g., Tech Innovation Summit 2026" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health &amp; Wellness</option>
                  <option value="Arts">Arts &amp; Culture</option>
                </select>
              </div>
              <div className="form-group">
                <label>Event Format</label>
                <select value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="In-Person">In-Person</option>
                  <option value="Virtual">Virtual/Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Describe your event..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Event Image</label>
              <div
                className={`ce-image-upload${imageData ? ' has-image' : ''}`}
                onClick={() => { if (!imageData) fileInputRef.current?.click(); }}
              >
                {imageData ? (
                  <>
                    <img src={imageData} alt="Event" />
                    <button type="button" className="ce-remove-image" onClick={e => { e.stopPropagation(); setImageData(null); }}>×</button>
                  </>
                ) : (
                  <>
                    <div className="ce-upload-icon">📸</div>
                    <div className="ce-upload-text">Click to upload or drag and drop</div>
                    <div className="ce-upload-hint">PNG, JPG up to 10MB (16:9 ratio recommended)</div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleImageFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {/* ── Step 2: Date & Location ── */}
        {step === 2 && (
          <div className="ce-card">
            <h1 className="ce-section-title">Date &amp; Location</h1>
            <p className="ce-section-sub">When and where will your event take place?</p>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Venue Name</label>
              <input type="text" placeholder="e.g., Sokha Hotel Convention Center" value={venueName} onChange={e => setVenueName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Full Address</label>
              <input type="text" placeholder="123 Tech Avenue, Prey Veng Province, Cambodia" value={venueAddress} onChange={e => setVenueAddress(e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Step 3: Tickets ── */}
        {step === 3 && (
          <div className="ce-card">
            <h1 className="ce-section-title">Tickets &amp; Pricing</h1>
            <p className="ce-section-sub">Set up your ticket types and pricing</p>
            <div className="ce-ticket-list">
              {tickets.map((t, i) => (
                <div key={i} className="ce-ticket-item">
                  <div className="ce-ticket-item-header">
                    <div className="ce-ticket-item-title">Ticket Type {i + 1}</div>
                    <button type="button" className="ce-remove-btn" onClick={() => removeTicket(i)}>🗑️</button>
                  </div>
                  <div className="ce-ticket-fields">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Ticket Name</label>
                      <input type="text" placeholder="e.g., General Admission" value={t.name} onChange={e => updateTicket(i, 'name', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Price ($)</label>
                      <input type="number" placeholder="250" min="0" value={t.price} onChange={e => updateTicket(i, 'price', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Quantity</label>
                      <input type="number" placeholder="1000" min="1" value={t.qty} onChange={e => updateTicket(i, 'qty', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Description</label>
                      <input type="text" placeholder="Access to all sessions" value={t.desc} onChange={e => updateTicket(i, 'desc', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="ce-add-btn" onClick={addTicket}>+ Add Another Ticket Type</button>
          </div>
        )}

        {/* ── Step 4: Agenda ── */}
        {step === 4 && (
          <div className="ce-card">
            <h1 className="ce-section-title">Event Agenda</h1>
            <p className="ce-section-sub">Add sessions, speakers, and schedule</p>
            <div className="ce-agenda-list">
              {agenda.map((a, i) => (
                <div key={i} className="ce-agenda-item">
                  <div className="ce-agenda-fields">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Time</label>
                      <input type="text" placeholder="09:00 AM - 10:00 AM" value={a.time} onChange={e => updateAgenda(i, 'time', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Session Title</label>
                      <input type="text" placeholder="Opening Keynote" value={a.session} onChange={e => updateAgenda(i, 'session', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Speaker</label>
                      <input type="text" placeholder="John Doe" value={a.speaker} onChange={e => updateAgenda(i, 'speaker', e.target.value)} />
                    </div>
                  </div>
                  <button type="button" className="ce-remove-btn" onClick={() => removeAgenda(i)}
                    style={{ position: 'absolute', top: 10, right: 10 }}>🗑️</button>
                </div>
              ))}
            </div>
            <button type="button" className="ce-add-btn" onClick={addAgenda}>+ Add Session</button>
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <div className="ce-card">
            <h1 className="ce-section-title">Review &amp; Publish</h1>
            <p className="ce-section-sub">Double-check your event details before publishing</p>
            <div className="ce-review-grid">
              <div className="ce-review-item">
                <div className="ce-review-label">Event Title</div>
                <div className="ce-review-value">{title || 'Not set'}</div>
              </div>
              <div className="ce-review-item">
                <div className="ce-review-label">Category &amp; Format</div>
                <div className="ce-review-value">{category || '—'} • {format}</div>
              </div>
              <div className="ce-review-item">
                <div className="ce-review-label">Date &amp; Time</div>
                <div className="ce-review-value">{startDate || '—'} at {startTime || '—'}</div>
              </div>
              <div className="ce-review-item">
                <div className="ce-review-label">Venue</div>
                <div className="ce-review-value">{venueName || '—'}</div>
              </div>
              <div className="ce-review-item ce-review-full">
                <div className="ce-review-label">Address</div>
                <div className="ce-review-value">{venueAddress || '—'}</div>
              </div>
              <div className="ce-review-item ce-review-full">
                <div className="ce-review-label">Description</div>
                <div className="ce-review-body">{description || '—'}</div>
              </div>
              <div className="ce-review-item ce-review-full">
                <div className="ce-review-label">Tickets</div>
                <div className="ce-review-body">
                  {tickets.filter(t => t.name || t.price).map((t, i) => (
                    <div key={i}><strong>{t.name || `Ticket ${i + 1}`}:</strong> ${t.price || 0} ({t.qty || 0} qty)</div>
                  ))}
                  {tickets.every(t => !t.name && !t.price) && 'No tickets configured'}
                </div>
              </div>
              <div className="ce-review-item ce-review-full">
                <div className="ce-review-label">Agenda</div>
                <div className="ce-review-body">
                  {agenda.filter(a => a.session).map((a, i) => (
                    <div key={i}><strong>{a.time || 'TBA'}:</strong> {a.session}</div>
                  ))}
                  {agenda.every(a => !a.session) && 'No sessions added'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="ce-nav">
          <button
            className="btn btn-outline"
            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            onClick={() => changeStep(-1)}
          >← Previous</button>
          <button
            className="btn btn-primary"
            onClick={() => changeStep(1)}
            disabled={submitting}
          >
            {isLastStep ? (submitting ? 'Publishing…' : publishLabel) : 'Next Step →'}
          </button>
        </div>
      </div>

      {/* Success modal */}
      {showModal && (
        <div className="ce-modal-overlay">
          <div className="ce-modal">
            <div className="ce-success-icon">✓</div>
            <h2>{editingEvent ? 'Event Updated!' : 'Event Created!'}</h2>
            <p>{editingEvent ? 'Your changes have been saved successfully.' : 'Your event has been published successfully.'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/organizer')}>View Dashboard</button>
          </div>
        </div>
      )}
    </>
  );
}

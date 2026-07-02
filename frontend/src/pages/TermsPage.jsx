import { Link, useNavigate } from 'react-router-dom';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import './LegalPage.css';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar">
        <Link className="nav-logo" to="/">
          <span className="logo-top">Planning</span>
          <span className="logo-bottom">Center</span>
        </Link>
        <div className="nav-links">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <i className="ri-arrow-left-line" /> Back
          </button>
          <Link to="/" className="btn btn-primary">
            <i className="ri-home-line" /> Home
          </Link>
        </div>
      </nav>

      <main className="legal-wrap">
        <button className="legal-back" onClick={() => navigate(-1)}>
          <i className="ri-arrow-left-s-line" /> Close
        </button>

        <div className="legal-header">
          <div className="legal-badge"><i className="ri-file-list-3-line" /> Legal</div>
          <h1>Terms &amp; Conditions</h1>
          <p className="legal-updated">Last Updated: June 15, 2026</p>
        </div>

        <div className="legal-body">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Planning Center, you agree to comply with these Terms and Conditions. If you do not agree, you must not use the platform.</p>

          <h2>2. User Accounts</h2>
          <h3>Registration</h3>
          <p>Users must provide accurate and complete information during registration.</p>

          <h3>Account Security</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining account confidentiality</li>
            <li>Protecting your password</li>
            <li>All activities performed through your account</li>
          </ul>
          <p>You must notify us immediately of any unauthorized use.</p>

          <h2>3. Event Registration</h2>
          <p>By registering for an event, you agree that:</p>
          <ul>
            <li>Registration information is accurate</li>
            <li>Event availability may be limited</li>
            <li>Organizers may impose additional event-specific requirements</li>
            <li>Attendance may be subject to venue rules and regulations</li>
          </ul>

          <h2>4. Payments</h2>
          <p>Where applicable, payment is required before registration is confirmed. Accepted payment methods may include:</p>
          <ul>
            <li>Credit cards</li>
            <li>Debit cards</li>
            <li>Digital payment services</li>
            <li>Other approved payment methods</li>
          </ul>
          <p>All prices are displayed in the applicable currency unless otherwise stated.</p>

          <h2>5. Refund Policy</h2>
          <p>Unless otherwise specified by the event organizer:</p>
          <div className="legal-highlight-box">
            <p>Full refund up to 7 days before the event &nbsp;·&nbsp; 50% refund within 7 days &nbsp;·&nbsp; No refund within 48 hours of start time</p>
          </div>
          <p>Processing fees charged by payment providers may be non-refundable where permitted by law.</p>

          <h2>6. Event Changes and Cancellations</h2>
          <p>Event organizers may modify schedules, change venues, replace speakers, reschedule, or cancel events. Where applicable, affected attendees will be notified and refund options may be provided according to organizer policies.</p>

          <h2>7. User Conduct</h2>
          <p>Users agree not to:</p>
          <ul>
            <li>Violate applicable laws</li>
            <li>Harass other users or attendees</li>
            <li>Submit false information</li>
            <li>Disrupt events</li>
            <li>Attempt unauthorized access to systems</li>
            <li>Upload malicious software</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these rules.</p>

          <h2>8. Intellectual Property</h2>
          <p>All platform content — including logos, designs, text, graphics, software, and branding — is owned by Planning Center or its licensors and protected by applicable intellectual property laws. Users may not reproduce, distribute, or exploit platform content without permission.</p>

          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, we are not liable for indirect damages, loss of profits, business interruption, event organizer actions, or event cancellations beyond our control. Our total liability shall not exceed the amount paid by the user for the relevant event registration.</p>

          <h2>10. Force Majeure</h2>
          <p>We are not responsible for delays or failures caused by events beyond reasonable control, including:</p>
          <ul>
            <li>Natural disasters</li>
            <li>Government actions</li>
            <li>Public health emergencies</li>
            <li>Internet outages</li>
            <li>Civil unrest</li>
          </ul>

          <h2>11. Termination</h2>
          <p>We may suspend or terminate access to the platform if terms are violated, fraudulent activity is suspected, or required by law.</p>

          <h2>12. Governing Law</h2>
          <p>These Terms and Conditions shall be governed by the laws of the Kingdom of Cambodia unless otherwise required by applicable law. Any disputes shall first be addressed through good-faith negotiations before pursuing legal remedies.</p>
        </div>

        <div className="legal-contact-box">
          <h2>13. Contact Information</h2>
          <p style={{ marginBottom: 18 }}>For questions regarding these Terms and Conditions:</p>
          <div className="legal-contact-row">
            <i className="ri-mail-line" />
            <span>Email: <a href="mailto:support@planningcenter.com">support@planningcenter.com</a></span>
          </div>
          <div className="legal-contact-row">
            <i className="ri-global-line" />
            <span>Website: <a href="/">planningcenter.com</a></span>
          </div>
          <div className="legal-contact-row">
            <i className="ri-map-pin-line" />
            <span>Russian Federation Blvd, Phnom Penh, Cambodia</span>
          </div>
        </div>
      </main>
    </>
  );
}

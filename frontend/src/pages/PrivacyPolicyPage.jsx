import { Link, useNavigate } from 'react-router-dom';
import '../../assets/css/1_global.css';
import '../../assets/css/2_navbar.css';
import './LegalPage.css';

export default function PrivacyPolicyPage() {
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
          <div className="legal-badge"><i className="ri-shield-check-line" /> Legal</div>
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last Updated: June 15, 2026</p>
        </div>

        <div className="legal-body">
          <h2>1. Introduction</h2>
          <p>Welcome to Planning Center. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and the choices available to you.</p>

          <h2>2. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>When you create an account, register for events, or contact us, we may collect:</p>
          <ul>
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number (if provided)</li>
            <li>Account credentials</li>
            <li>Profile information</li>
          </ul>

          <h3>Event Information</h3>
          <p>We may collect:</p>
          <ul>
            <li>Event registrations</li>
            <li>Attendance records</li>
            <li>Ticket purchases</li>
            <li>Event preferences</li>
          </ul>

          <h3>Payment Information</h3>
          <p>Payments are processed through secure payment providers. We do not store complete payment card information on our servers.</p>

          <h3>Technical Information</h3>
          <p>We may automatically collect:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Usage statistics</li>
            <li>Cookies and similar technologies</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Create and manage your account</li>
            <li>Process event registrations</li>
            <li>Deliver tickets and confirmations</li>
            <li>Process payments</li>
            <li>Communicate important event updates</li>
            <li>Improve our platform and services</li>
            <li>Provide customer support</li>
            <li>Prevent fraud and unauthorized activity</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <h3>Event Organizers</h3>
          <p>Information necessary for managing event registrations and attendance.</p>

          <h3>Service Providers</h3>
          <p>Trusted third parties that help us provide services, including payment processors, hosting providers, and email delivery services.</p>

          <h3>Legal Requirements</h3>
          <p>When required by law, regulation, court order, or governmental authority.</p>
          <p>We do not sell personal information to third parties.</p>

          <h2>5. Data Security</h2>
          <p>We implement reasonable technical and organizational measures to protect personal information, including:</p>
          <ul>
            <li>Encrypted data transmission</li>
            <li>Access controls</li>
            <li>Secure authentication procedures</li>
            <li>Regular security monitoring</li>
          </ul>
          <p>No system can guarantee absolute security. Users are responsible for maintaining the confidentiality of their account credentials.</p>

          <h2>6. Data Retention</h2>
          <p>We retain personal information only as long as necessary to:</p>
          <ul>
            <li>Provide services</li>
            <li>Meet legal requirements</li>
            <li>Resolve disputes</li>
            <li>Enforce agreements</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>Subject to applicable laws, you may have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Withdraw consent where applicable</li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p>To exercise these rights, contact us using the information provided below.</p>

          <h2>8. Cookies</h2>
          <p>We use cookies and similar technologies to improve user experience, maintain sessions, analyze usage, and enhance platform functionality. For more information, please review our Cookie Policy.</p>

          <h2>9. Children's Privacy</h2>
          <p>Our services are not intended for children under the age required by applicable law. We do not knowingly collect personal information from children without appropriate authorization.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes become effective upon posting the updated version on our platform.</p>
        </div>

        <div className="legal-contact-box">
          <h2>11. Contact Us</h2>
          <p style={{ marginBottom: 18 }}>If you have questions regarding this Privacy Policy, please contact us:</p>
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

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// ── Lazy-loaded pages (mirrors old HTML pages) ──────────────────────────────
const EventsPage            = lazy(() => import('./pages/EventsPage.jsx'));
const EventDetailPage       = lazy(() => import('./pages/EventDetailPage.jsx'));
const EventRegistrationPage = lazy(() => import('./pages/EventRegistrationPage.jsx'));
const LoginPage             = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage          = lazy(() => import('./pages/RegisterPage.jsx'));
const AttendeeDashboard  = lazy(() => import('./pages/AttendeeDashboard.jsx'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard.jsx'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard.jsx'));
const SuperadminDashboard = lazy(() => import('./pages/SuperadminDashboard.jsx'));
const TicketPage         = lazy(() => import('./pages/TicketPage.jsx'));
const CreateEventPage    = lazy(() => import('./pages/CreateEventPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const PrivacyPolicyPage  = lazy(() => import('./pages/PrivacyPolicyPage.jsx'));
const TermsPage          = lazy(() => import('./pages/TermsPage.jsx'));
const NotFound           = lazy(() => import('./pages/NotFound.jsx'));

// ── Redirect unauthenticated users to /login ────────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

// ── Redirect already-logged-in users away from auth pages ───────────────────
function GuestRoute({ children }) {
  const { user, role } = useAuth();
  if (!user) return children;
  const dest = {
    Supervisor: '/superadmin',
    Admin:      '/admin',
    Organizer:  '/organizer',
    Attendee:   '/dashboard',
  };
  return <Navigate to={dest[role] || '/'} replace />;
}

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div className="spinner" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<EventsPage />} />
          <Route path="/events"        element={<EventsPage />} />
          <Route path="/events/:id"    element={<EventDetailPage />} />
          <Route path="/login"         element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"      element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/event-registration" element={<EventRegistrationPage />} />
          <Route path="/forgot-password"   element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/privacy-policy"    element={<PrivacyPolicyPage />} />
          <Route path="/terms"             element={<TermsPage />} />

          {/* Protected — Attendee */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={['Attendee']}>
              <AttendeeDashboard />
            </PrivateRoute>
          } />

          {/* Protected — Organizer (create/edit event) */}
          <Route path="/create-event" element={
            <PrivateRoute roles={['Organizer', 'Admin', 'Supervisor']}>
              <CreateEventPage />
            </PrivateRoute>
          } />

          {/* Protected — Organizer */}
          <Route path="/organizer" element={
            <PrivateRoute roles={['Organizer', 'Admin', 'Supervisor']}>
              <OrganizerDashboard />
            </PrivateRoute>
          } />

          {/* Protected — Admin */}
          <Route path="/admin" element={
            <PrivateRoute roles={['Admin', 'Supervisor']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Protected — Supervisor */}
          <Route path="/superadmin" element={
            <PrivateRoute roles={['Supervisor']}>
              <SuperadminDashboard />
            </PrivateRoute>
          } />

          {/* Ticket view */}
          <Route path="/ticket" element={
            <PrivateRoute roles={['Attendee', 'Admin', 'Organizer', 'Supervisor']}>
              <TicketPage />
            </PrivateRoute>
          } />
          <Route path="/ticket/:code" element={
            <PrivateRoute roles={['Attendee', 'Admin', 'Organizer', 'Supervisor']}>
              <TicketPage />
            </PrivateRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

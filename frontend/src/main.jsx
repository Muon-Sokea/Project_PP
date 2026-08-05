import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Apply saved theme before first paint so there's no flash on any page
;(() => {
  const t = localStorage.getItem('erms_theme') || 'auto';
  const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();

// Note: <StrictMode> was removed to prevent the Google Identity Services
// 'initialize() called multiple times' warning (StrictMode double-mounts
// all components in development, which triggers Google's duplicate-init guard).
// This has no impact on production builds — StrictMode only runs in dev.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

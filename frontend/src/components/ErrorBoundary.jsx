import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          fontFamily: "'Inter', sans-serif",
          background: 'var(--bg-light, #f7f8fc)',
          color: 'var(--text-dark, #1a1a2e)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 20, color: '#dc2626',
          }}>
            <i className="ri-error-warning-line" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-light, #8888a0)',
            maxWidth: 420, lineHeight: 1.6, marginBottom: 24,
          }}>
            The dashboard encountered an unexpected error. This might be a
            temporary issue — try refreshing the page.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: '1.5px solid var(--border, #e5e7f0)',
                background: 'var(--bg-white, #fff)',
                color: 'var(--text-dark, #1a1a2e)',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
              }}
            >
              ← Go to Home
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '10px 28px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #F5A623 0%, #f7c26b 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
            >
              <i className="ri-refresh-line" style={{ marginRight: 6 }} />
              Refresh Page
            </button>
          </div>
          <details style={{ marginTop: 24, maxWidth: 500, textAlign: 'left' }}>
            <summary style={{
              fontSize: 12, color: 'var(--text-light, #8888a0)',
              cursor: 'pointer', marginBottom: 8,
            }}>
              Error details
            </summary>
            <pre style={{
              fontSize: 11, background: '#1e1e2e', color: '#f2f2f7',
              padding: 14, borderRadius: 8, overflow: 'auto',
              maxHeight: 200, lineHeight: 1.5,
            }}>
              {this.state.error?.message || 'Unknown error'}
              {'\n'}
              {this.state.error?.stack || ''}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

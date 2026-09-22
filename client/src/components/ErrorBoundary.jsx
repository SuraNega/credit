import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--bg-app)',
            color: 'var(--text-primary)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '50%',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle size={42} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Oops! Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '420px',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}
          >
            An unexpected error occurred. You can reload the app to continue your work safely.
          </p>

          <button
            className="btn btn-primary"
            onClick={this.handleReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

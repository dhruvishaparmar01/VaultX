import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('VaultX Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: '#050D1A' }}
        >
          <div
            className="rounded-2xl p-8 max-w-md w-full text-center"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-white font-bold text-xl mb-2">Something went wrong</p>
            <p className="text-white/50 text-sm mb-6">VaultX encountered an unexpected error.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/dashboard';
              }}
              className="px-6 py-2 rounded-xl text-white font-medium"
              style={{ background: '#2563EB' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

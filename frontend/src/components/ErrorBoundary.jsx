import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ZESTRO error boundary:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state">
          <span className="emoji">😵</span>
          <h2>Something went wrong</h2>
          <p className="muted">An unexpected error occurred while rendering this page.</p>
          {this.state.error && (
            <div style={{ maxWidth: 650, margin: '16px auto', padding: 14, background: '#fef2f2', border: '1px solid #f87171', borderRadius: 8, textAlign: 'left', color: '#b91c1c', fontSize: 13, wordBreak: 'break-word' }}>
              <strong>Error:</strong> {this.state.error.message || String(this.state.error)}
              {this.state.error.stack && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#991b1b' }}>Stack Trace</summary>
                  <pre style={{ marginTop: 6, fontSize: 11, color: '#7f1d1d', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            <button className="btn btn-secondary" onClick={() => this.setState({ hasError: false, error: null })}>Try Again</button>
            <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}>Go Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

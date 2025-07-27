import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
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

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <AlertTriangle size={48} style={{ color: '#e53e3e', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1rem', color: '#4a5568' }}>
              应用程序遇到错误
            </h2>
            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
              请刷新页面或检查浏览器是否支持以下功能：
            </p>
            <ul style={{ 
              textAlign: 'left', 
              color: '#718096', 
              marginBottom: '1.5rem',
              listStyle: 'none',
              padding: 0
            }}>
              <li>✓ JavaScript 已启用</li>
              <li>✓ 支持 SharedArrayBuffer (用于 FFmpeg)</li>
              <li>✓ 支持 WebAssembly</li>
              <li>✓ 现代浏览器 (Chrome 88+, Firefox 89+, Safari 15.2+)</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              <RefreshCw size={16} />
              刷新页面
            </button>
            
            {this.state.error && (
              <details style={{ 
                marginTop: '1rem', 
                textAlign: 'left',
                background: '#f7fafc',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                  错误详情
                </summary>
                <pre style={{ 
                  fontSize: '0.8rem', 
                  color: '#e53e3e',
                  whiteSpace: 'pre-wrap',
                  marginTop: '0.5rem'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
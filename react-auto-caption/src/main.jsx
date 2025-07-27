import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// 检查浏览器支持
const checkBrowserSupport = () => {
  const issues = [];
  
  if (!window.SharedArrayBuffer) {
    issues.push('SharedArrayBuffer not supported (required for FFmpeg)');
  }
  
  if (!window.WebAssembly) {
    issues.push('WebAssembly not supported');
  }
  
  if (issues.length > 0) {
    console.warn('Browser compatibility issues:', issues);
  }
  
  return issues;
};

const issues = checkBrowserSupport();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
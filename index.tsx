import React from 'react';
import ReactDOM from 'react-dom/client';
import MainRouter from './MainRouter';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fff', color: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>系統啟動失敗 🛠️</h2>
          <p style={{ color: '#666', marginBottom: '10px' }}>偵測到執行階段錯誤，這可能是由於數據格式不相容造成的。</p>
          <pre style={{ background: '#f0f0f0', padding: '15px', borderRadius: '12px', overflow: 'auto', maxWidth: '90%', fontSize: '12px', color: '#d00' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: '30px', padding: '14px 28px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}>
            清除數據並嘗試修復 (Reset & Fix)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <MainRouter />
    </ErrorBoundary>
  </React.StrictMode>
);

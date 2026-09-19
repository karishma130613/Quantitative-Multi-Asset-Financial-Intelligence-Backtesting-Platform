import React, { useState } from 'react';
import { AlertCircle, X, ShieldCheck } from 'lucide-react';

export default function DisclaimerBanner() {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          zIndex: 40,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          padding: '6px 12px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}
      >
        <ShieldCheck size={14} color="var(--accent-cyan)" />
        <span>Compliance Disclaimer</span>
      </button>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(13, 20, 35, 0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--border-color)',
        padding: '8px 16px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        bottom: 0,
        zIndex: 35,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '1200px', margin: '0 auto' }}>
        <AlertCircle size={14} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>Institutional Notice:</strong> This platform is intended for educational, research and historical analysis purposes. Backtested performance does not guarantee future returns and should not be considered financial advice.
        </span>
      </div>
      <button
        onClick={() => setMinimized(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Minimize disclaimer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

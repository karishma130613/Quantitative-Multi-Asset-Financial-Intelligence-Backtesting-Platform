import React from 'react';

export function LoadingSkeleton({ height = '120px', width = '100%', borderRadius = '12px' }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius,
        marginBottom: '12px',
      }}
    />
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '36px',
        textAlign: 'center',
        margin: '20px 0',
        borderColor: 'rgba(255, 51, 102, 0.3)',
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'rgba(255, 51, 102, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        color: 'var(--accent-red)',
        fontSize: '1.4rem',
      }}>
        ⚠️
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
        System Diagnostics Alert
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 20px' }}>
        {message || 'An unexpected computational exception occurred while processing request.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-cyan" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
          Retry Calculation
        </button>
      )}
    </div>
  );
}

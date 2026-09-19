import React, { useState } from 'react';
import { api } from '../../services/api';
import { Mail, KeyRound, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword({ onNavigate, setResetTokenProp }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [demoToken, setDemoToken] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await api.auth.forgotPassword({ email });
      setMsg(res.message);
      if (res.demo_reset_token) {
        setDemoToken(res.demo_reset_token);
        if (setResetTokenProp) setResetTokenProp(res.demo_reset_token);
      }
    } catch (err) {
      setError(err.message || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
        <button
          onClick={() => onNavigate('login')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <KeyRound size={22} color="var(--accent-amber)" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '6px' }}>
            RESET CREDENTIALS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Enter your institutional email to generate a secure reset token.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 51, 102, 0.12)', padding: '10px', borderRadius: '8px', color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {msg ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(0, 223, 143, 0.1)', border: '1px solid rgba(0, 223, 143, 0.3)', borderRadius: '8px', padding: '14px', color: 'var(--accent-green)', fontSize: '0.82rem', marginBottom: '16px' }}>
              <CheckCircle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
              {msg}
            </div>

            {demoToken && (
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', marginBottom: '18px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>GENERATED RESET TOKEN:</div>
                <div className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--accent-cyan)' }}>
                  {demoToken}
                </div>
              </div>
            )}

            <button
              onClick={() => onNavigate('reset-password')}
              className="btn-cyan"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Continue to Set New Password <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                REGISTERED EMAIL
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@quantlab.io"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyan"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Dispatching Token...' : 'Generate Reset Token'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

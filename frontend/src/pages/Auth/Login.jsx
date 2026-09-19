import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login({ onNavigate, initialMode = 'login' }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();

    if (mode === 'login') {
      if (!cleanEmail) {
        setError('Please enter your email.');
        return;
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        setError('Email invalid');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setLoading(true);
      try {
        await login(cleanEmail, password);
        onNavigate('dashboard');
      } catch (err) {
        setError(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    } else {
      if (!cleanEmail) {
        setError('Please enter your email.');
        return;
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        setError('Email invalid');
        return;
      }
      if (!password) {
        setError('Please enter a password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        await signup(cleanEmail, password, fullName.trim() || 'Quantitative Researcher');
        onNavigate('dashboard');
      } catch (err) {
        setError(err.message || 'Registration failed. Email may already exist.');
      } finally {
        setLoading(false);
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="QuantLab Logo"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              objectFit: 'contain',
              margin: '0 auto 12px',
              display: 'block',
              boxShadow: '0 0 20px var(--accent-cyan-glow)',
            }}
          />
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', letterSpacing: '0.04em', marginBottom: '6px' }}>
            QUANTLAB ACCESS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Secure Quantitative Intelligence Environment
          </p>
        </div>

        {/* Side-by-side option buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={mode === 'login' ? 'btn-cyan' : 'btn-secondary'}
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '9px 12px',
              fontSize: '0.82rem',
            }}
          >
            <Lock size={15} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={mode === 'signup' ? 'btn-purple' : 'btn-secondary'}
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '9px 12px',
              fontSize: '0.82rem',
            }}
          >
            <User size={15} />
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.12)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
            marginBottom: '18px',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sign Up: Full Name */}
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                RESEARCHER NAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Evelyn Vance"
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
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              INSTITUTIONAL EMAIL
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

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {mode === 'signup' ? 'PASSWORD (MIN. 6 CHARACTERS)' : 'ACCESS KEY / PASSWORD'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Forgot key?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 38px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign Up: Confirm Password */}
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={mode === 'login' ? 'btn-cyan' : 'btn-purple'}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
          >
            {loading
              ? (mode === 'login' ? 'Authenticating...' : 'Creating Account...')
              : (mode === 'login' ? 'Authorize Terminal Session' : 'Initialize Account')}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Switch link */}
        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'underline' }}>
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'underline' }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

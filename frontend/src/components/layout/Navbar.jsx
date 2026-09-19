import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { 
  Sun, Moon, Cpu, Bot, User, LogOut, Menu, X, 
  TrendingUp, Activity, ShieldCheck 
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, sidebarCollapsed, onOpenAI, onNavigate, currentPath }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [liveAssets, setLiveAssets] = useState([]);

  // Fetch live asset prices for ticker
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const data = await api.market.getAssets();
        setLiveAssets(data);
      } catch (e) {
        // Silently fail — use fallback static tickers
      }
    };
    fetchTickers();
    const interval = setInterval(fetchTickers, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Build ticker items from live data or fallback to static
  const tickers = liveAssets.length > 0
    ? liveAssets.map(a => ({
        sym: a.symbol.split('-')[0],
        price: `$${a.current_price?.toLocaleString() || '0.00'}`,
        chg: `${a.change_24h_pct >= 0 ? '+' : ''}${a.change_24h_pct}%`,
        up: a.change_24h_pct >= 0,
      }))
    : [
        { sym: 'GLD', price: '$2,740.50', chg: '+0.62%', up: true },
        { sym: 'BTC', price: '$96,820.00', chg: '+3.45%', up: true },
        { sym: 'NVDA', price: '$134.20', chg: '+2.18%', up: true },
        { sym: 'SPY', price: '$592.40', chg: '+0.54%', up: true },
        { sym: 'ETH', price: '$2,820.10', chg: '-0.42%', up: false },
      ];


  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-card)',
      backdropFilter: 'var(--backdrop-blur)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: 3-Bar Sidebar Toggle & Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {!['login', 'forgot-password', 'reset-password'].includes(currentPath) && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} />
          </button>
        )}

        <div 
          onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <img
            src="/logo.png"
            alt="QuantLab Logo"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              objectFit: 'contain',
              boxShadow: '0 0 16px var(--accent-cyan-glow)',
            }}
          />
          <div>
            <div style={{ fontWeight: '800', letterSpacing: '0.08em', fontSize: '1.1rem', background: 'linear-gradient(90deg, #00f0ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QUANTLAB
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '-2px' }}>
              Research Terminal
            </div>
          </div>
        </div>

        {/* Engine status pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 223, 143, 0.1)',
          border: '1px solid rgba(0, 223, 143, 0.25)',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          color: 'var(--accent-green)',
          fontWeight: '600',
        }}>
          <div className="pulse-dot" />
          <span>ENGINE ONLINE</span>
        </div>
      </div>

      {/* Middle: Live Multi-Asset Ticker Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        overflowX: 'auto',
        padding: '0 12px',
        maxWidth: '540px',
      }} className="hide-on-mobile">
        {tickers.map(t => (
          <div key={t.sym} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{t.sym}</span>
            <span className="mono" style={{ color: 'var(--text-primary)' }}>{t.price}</span>
            <span style={{ 
              color: t.up ? 'var(--accent-green)' : 'var(--accent-red)',
              fontSize: '0.7rem',
              fontWeight: '600',
            }}>
              {t.chg}
            </span>
          </div>
        ))}
      </div>

      {/* Right: Actions, AI Assistant, Theme, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* AI Assistant Quick Trigger - only for authenticated internal pages */}
        {!['login', 'signup', 'forgot-password', 'reset-password'].includes(currentPath) && (
          <button
            onClick={onOpenAI}
            className="btn-cyan"
            style={{ padding: '7px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
            title="Open AI Research Assistant"
          >
            <Bot size={15} />
            <span className="hide-on-mobile">AI Quant</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} color="var(--accent-amber)" /> : <Moon size={17} color="var(--accent-cyan)" />}
        </button>

        {/* User Profile / Auth State - strictly hidden on login/signup/reset pages */}
        {!['login', 'signup', 'forgot-password', 'reset-password'].includes(currentPath) && (
          isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 10px 4px 6px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <img
                  src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantLab'}
                  alt="Avatar"
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: '500' }} className="hide-on-mobile">
                  {user?.full_name?.split(' ')[0] || 'Researcher'}
                </span>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '220px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{user?.full_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { onNavigate('profile'); setProfileOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    className="dropdown-item"
                  >
                    <User size={15} />
                    <span>Profile & Settings</span>
                  </button>
                  <button
                    onClick={() => { logout(); setProfileOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-red)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    className="dropdown-item"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => onNavigate('login')}
                className="btn-cyan"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Sign In
              </button>
            </div>
          )
        )}
      </div>
    </header>
  );
}

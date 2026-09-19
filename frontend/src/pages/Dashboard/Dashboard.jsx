import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import ThreeCanvas from '../../components/layout/ThreeCanvas';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import { 
  TrendingUp, Shield, Activity, Zap, Play, 
  ArrowRight, SearchCheck, CloudSun, Bot, BarChart3, Layers
} from 'lucide-react';

export default function Dashboard({ onNavigate, onSelectAsset }) {
  const [assets, setAssets] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsData, expsData] = await Promise.all([
        api.market.getAssets(),
        api.experiments.list().catch(() => []),
      ]);
      setAssets(assetsData);
      setExperiments(expsData);
    } catch (err) {
      setError(err.message || 'Failed to initialize quantitative terminal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAssetClick = (sym) => {
    if (onSelectAsset) onSelectAsset(sym);
    onNavigate('market-explorer');
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <LoadingSkeleton height="110px" />
          <LoadingSkeleton height="110px" />
          <LoadingSkeleton height="110px" />
          <LoadingSkeleton height="110px" />
        </div>
        <LoadingSkeleton height="360px" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Lab Pulse & Welcome */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(6, 14, 32, 0.35) 0%, rgba(168, 85, 247, 0.12) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '650px', zIndex: 2 }}>
          <div className="badge badge-cyan" style={{ marginBottom: '10px' }}>
            <Zap size={12} /> QUANTLAB TERMINAL v1.0.0
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Quantitative Multi-Asset Research Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
            Institutional-grade multi-asset intelligence across Gold, Bitcoin, NVIDIA, and equities.
            Perform bias-free algorithmic backtesting, forensic diagnosis via <strong>Strategy Detective</strong>, and historical classification with <strong>Market Weather</strong>.
          </p>
        </div>

        {/* Quick Action Pill buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', zIndex: 2 }} className="hide-on-mobile">
          <button onClick={() => onNavigate('strategy-lab')} className="btn-cyan">
            <Play size={15} /> Launch Backtest
          </button>
          <button onClick={() => onNavigate('market-weather')} className="btn-secondary">
            <CloudSun size={15} color="var(--accent-amber)" /> Market Weather
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <MetricCard
          title="ACTIVE ASSET UNIVERSE"
          value={assets.length}
          subtitle="Gold, Crypto, Tech, Indexes & Rates"
          icon={Layers}
        />
        {(() => {
          const bestAsset = assets.length > 0 ? assets.reduce((best, a) => a.change_24h_pct > best.change_24h_pct ? a : best, assets[0]) : null;
          return (
            <MetricCard
              title="TOP 24H PERFORMER"
              value={bestAsset ? bestAsset.symbol.split('-')[0] : 'BTC-USD'}
              change={bestAsset ? `+${bestAsset.change_24h_pct}%` : '+3.45%'}
              isPositive={true}
              subtitle={`Spot: $${bestAsset?.current_price?.toLocaleString() || '96,820'}`}
              icon={TrendingUp}
            />
          );
        })()}
        {(() => {
          const avgSharpe = assets.length > 0 ? (assets.reduce((sum, a) => sum + (a.sharpe_ratio || 0), 0) / assets.length).toFixed(2) : '1.62';
          const bestSharpe = assets.length > 0 ? Math.max(...assets.map(a => a.sharpe_ratio || 0)).toFixed(2) : '2.06';
          return (
            <MetricCard
              title="PORTFOLIO AVG SHARPE"
              value={avgSharpe}
              change={`Best: ${bestSharpe}`}
              isPositive={parseFloat(avgSharpe) > 0.5}
              subtitle="Risk-adjusted universe benchmark"
              icon={Shield}
            />
          );
        })()}
        {(() => {
          const regimeCounts = {};
          assets.forEach(a => { if (a.current_regime) regimeCounts[a.current_regime] = (regimeCounts[a.current_regime] || 0) + 1; });
          const topRegime = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1])[0];
          const regimeEmoji = {
            'Bull Market': '☀️',
            'Bear Market': '🌧️',
            'Sideways Market': '🌫️',
            'High Volatility': '⛈️',
          };
          return (
            <MetricCard
              title="DOMINANT MARKET REGIME"
              value={topRegime ? `${regimeEmoji[topRegime[0]] || '📊'} ${topRegime[0].replace(' Market', '')}` : '📊 Detecting...'}
              subtitle={topRegime ? `${topRegime[1]} of ${assets.length} assets in this regime` : 'ML K-Means regime detection'}
              icon={Activity}
            />
          );
        })()}
      </div>

      {/* Middle Section: 3D Data Sphere & Multi-Asset Intelligence Pulse */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Multi-Asset Live Performance Grid */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Multi-Asset Quantitative Pulse</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realized Volatility, Sharpe & Maximum Drawdown</p>
            </div>
            <button
              onClick={() => onNavigate('market-explorer')}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              Explore All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assets.slice(0, 5).map((a) => {
              // Render mini SVG sparkline
              const spark = a.sparkline || [];
              const n = spark.length;
              const minS = Math.min(...spark);
              const maxS = Math.max(...spark);
              const sRange = maxS - minS || 1;
              const isPositiveTrend = n > 1 && spark[n - 1] > spark[0];
              const sparkColor = isPositiveTrend ? 'var(--accent-green)' : 'var(--accent-red)';
              const sparkGlow = isPositiveTrend ? 'rgba(0,223,143,0.3)' : 'rgba(255,51,102,0.3)';
              const sparkPoints = spark.map((v, i) => {
                const x = (i / (n - 1)) * 70;
                const y = 24 - ((v - minS) / sRange) * 20;
                return `${x},${y}`;
              }).join(' ');
              const areaPoints = `0,24 ${sparkPoints} 70,24`;

              return (
                <div
                  key={a.symbol}
                  onClick={() => handleAssetClick(a.symbol)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="asset-row-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      color: 'var(--accent-cyan)',
                    }}>
                      {a.symbol.split('-')[0].slice(0, 4)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{a.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.category} • Vol: {a.annualized_volatility}%</div>
                    </div>
                  </div>

                  {/* Mini Sparkline SVG */}
                  {spark.length > 2 && (
                    <svg width="72" height="26" style={{ flexShrink: 0, overflow: 'visible' }}>
                      <defs>
                        <linearGradient id={`sg-${a.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={sparkColor} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={areaPoints} fill={`url(#sg-${a.symbol})`} />
                      <polyline
                        points={sparkPoints}
                        fill="none"
                        stroke={sparkColor}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 3px ${sparkGlow})` }}
                      />
                    </svg>
                  )}

                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                      ${a.current_price?.toLocaleString()}
                    </div>
                    <div style={{
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      color: a.change_24h_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {a.change_24h_pct >= 0 ? `+${a.change_24h_pct}%` : `${a.change_24h_pct}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D Visual Asset Nodes & Correlation Sphere */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>3D Asset Network Sphere</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interactive spatial relationship clustering</p>
            </div>
            <span className="badge badge-purple">Spatial Graph</span>
          </div>

          <div style={{ flex: 1, minHeight: '260px', position: 'relative' }}>
            <ThreeCanvas assets={['GLD', 'BTC', 'NVDA', 'SPY', 'ETH', 'QQQ', 'AAPL', 'TLT']} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Drag to rotate • Real-time coordinate projection</span>
            <button
              onClick={() => onNavigate('correlation-lab')}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}
            >
              Open Correlation Lab →
            </button>
          </div>
        </div>
      </div>

      {/* Feature Showcase Quick Actions: Detective, Weather, Stress, AI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div 
          onClick={() => onNavigate('strategy-detective')}
          className="glass-panel glass-panel-hover" 
          style={{ padding: '20px', cursor: 'pointer', borderColor: 'rgba(0, 240, 255, 0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)' }}>
              <SearchCheck size={20} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>🔎 Strategy Detective</h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Forensic breakdown explaining WHY strategies succeed or fail: trend impact, fee drag, whipsaws, and drawdown anatomy.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('market-weather')}
          className="glass-panel glass-panel-hover" 
          style={{ padding: '20px', cursor: 'pointer', borderColor: 'rgba(245, 158, 11, 0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
              <CloudSun size={20} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>🌦️ Market Weather</h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Classify historical conditions into Bull ☀️, Bear 🌧️, Sideways 🌫️, and High Volatility ⛈️ with an interactive timeline scrubber.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('stress-test')}
          className="glass-panel glass-panel-hover" 
          style={{ padding: '20px', cursor: 'pointer', borderColor: 'rgba(255, 51, 102, 0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 51, 102, 0.1)', color: 'var(--accent-red)' }}>
              <BarChart3 size={20} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>💥 Strategy Stress Test</h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Replay historical black swan crashes (2020 Covid liquidity shock, 2022 tightening) and test 5x extreme slippage shocks.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('ai-assistant')}
          className="glass-panel glass-panel-hover" 
          style={{ padding: '20px', cursor: 'pointer', borderColor: 'rgba(157, 78, 221, 0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(157, 78, 221, 0.1)', color: 'var(--accent-purple)' }}>
              <Bot size={20} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>🤖 AI Research Assistant</h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Ask natural language questions grounded in verified platform math. Zero hallucinations, institutional precision.
          </p>
        </div>
      </div>
    </div>
  );
}

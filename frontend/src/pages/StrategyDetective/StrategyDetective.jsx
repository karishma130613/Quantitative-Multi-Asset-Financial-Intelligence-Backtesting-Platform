import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import MetricCard from '../../components/common/MetricCard';
import { 
  SearchCheck, TrendingUp, AlertTriangle, DollarSign, 
  Activity, ShieldAlert, CheckCircle2, ArrowRight, BarChart2 
} from 'lucide-react';

export default function StrategyDetective({ backtestPayload, onNavigate }) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asset, setAsset] = useState(backtestPayload?.asset || 'BTC-USD');
  const [strategyType, setStrategyType] = useState(backtestPayload?.strategy_name || 'sma_crossover');

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.detective.analyze({
        asset,
        strategy_type: strategyType,
        params: { fast_period: 20, slow_period: 50, start_date: '2021-01-01' },
        backtest_result: backtestPayload,
      });
      setDiagnosis(resp);
    } catch (err) {
      setError(err.message || 'Strategy Detective forensic analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [asset, strategyType]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton height="120px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <LoadingSkeleton height="260px" />
          <LoadingSkeleton height="260px" />
          <LoadingSkeleton height="260px" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={runAnalysis} />;
  }

  const {
    verdict,
    key_takeaways = [],
    trend_impact = {},
    cost_impact = {},
    false_signals = {},
    drawdown_analysis = {},
    regime_impact = {},
  } = diagnosis || {};

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-purple" style={{ marginBottom: '8px' }}>
            <SearchCheck size={12} /> FORENSIC QUANTITATIVE AUDIT
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>🔎 Strategy Detective</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Mathematical attribution engine: Why did the strategy behave this way?
          </p>
        </div>

        {/* Asset & Strategy Switchers */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              outline: 'none',
            }}
          >
            {['BTC-USD', 'GLD', 'NVDA', 'SPY', 'ETH-USD', 'QQQ'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={strategyType}
            onChange={(e) => setStrategyType(e.target.value)}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              outline: 'none',
            }}
          >
            <option value="sma_crossover">SMA Crossover (20/50)</option>
            <option value="ema_trend">EMA Trend (12/26)</option>
            <option value="momentum">Momentum (14)</option>
            <option value="mean_reversion">Mean Reversion</option>
          </select>
        </div>
      </div>

      {/* Forensic Verdict Banner */}
      <div className="glass-panel" style={{
        padding: '22px 26px',
        borderLeft: '4px solid var(--accent-cyan)',
        background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.08) 0%, var(--bg-card) 100%)',
      }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '4px' }}>
          PRIMARY FORENSIC VERDICT
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px' }}>
          {verdict}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {key_takeaways.map((point, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Core Detective Forensic Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* 1. Trend Impact */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '700' }}>1. Trend Capture Impact</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bull vs Bear vs Sideways efficiency</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BULL RETURN</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                +{trend_impact.bull_market_return}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BEAR RETURN</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: trend_impact.bear_market_return >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {trend_impact.bear_market_return}%
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: 'auto' }}>
            {trend_impact.summary}
          </p>
        </div>

        {/* 2. Transaction Cost Drag */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
              <DollarSign size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '700' }}>2. Transaction Cost Drag</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gross returns vs Net return friction</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GROSS RETURN</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                {cost_impact.gross_return_pct}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL FRICTION FEES</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-amber)' }}>
                ${cost_impact.total_fees_usd?.toLocaleString()}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: 'auto' }}>
            {cost_impact.summary}
          </p>
        </div>

        {/* 3. False Signal Impact */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 51, 102, 0.1)', color: 'var(--accent-red)' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '700' }}>3. False Signal Impact</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Whipsaw breakouts during consolidation</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WHIPSAW RATE</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-red)' }}>
                {false_signals.whipsaw_pct}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WHIPSAW PENALTY</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-red)' }}>
                ${false_signals.whipsaw_loss_usd?.toLocaleString()}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: 'auto' }}>
            {false_signals.summary}
          </p>
        </div>

        {/* 4. Drawdown Analysis */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(157, 78, 221, 0.1)', color: 'var(--accent-purple)' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '700' }}>4. Drawdown Post-Mortem</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Peak-to-trough capital impairment</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MAX DRAWDOWN</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-red)' }}>
                -{drawdown_analysis.max_drawdown_pct}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LONGEST EPISODE</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {drawdown_analysis.longest_drawdown_days} Days
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: 'auto' }}>
            {drawdown_analysis.summary}
          </p>
        </div>

        {/* 5. Market Regime Breakdown */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 223, 143, 0.1)', color: 'var(--accent-green)' }}>
              <Activity size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '700' }}>5. Market Regime Attribution</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ML Cluster return distribution</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BEST REGIME</div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                {regime_impact.best_regime}
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WORST REGIME</div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-red)' }}>
                {regime_impact.worst_regime}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: 'auto' }}>
            {regime_impact.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

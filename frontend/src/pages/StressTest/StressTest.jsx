import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import { 
  ShieldAlert, AlertTriangle, CheckCircle, Flame, 
  Play, Sliders, TrendingDown, Percent, DollarSign 
} from 'lucide-react';

export default function StressTest({ onNavigate }) {
  const [asset, setAsset] = useState('BTC-USD');
  const [strategyType, setStrategyType] = useState('sma_crossover');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const runStress = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.stress.run({
        asset,
        strategy_type: strategyType,
        params: { fast_period: 20, slow_period: 50 },
      });
      setData(resp);
    } catch (err) {
      setError(err.message || 'Stress test simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runStress();
  }, [asset, strategyType]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton height="100px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <LoadingSkeleton height="160px" />
          <LoadingSkeleton height="160px" />
          <LoadingSkeleton height="160px" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={runStress} />;
  }

  const {
    base_return,
    base_drawdown,
    base_sharpe,
    scenarios = [],
    cost_sensitivity = [],
    fragility_score = 45,
    summary = '',
  } = data || {};

  const getStatusBadge = (status) => {
    if (status === 'PASS') return <span className="badge badge-green">PASS</span>;
    if (status === 'WARNING') return <span className="badge badge-amber">WARNING</span>;
    return <span className="badge badge-red">FAIL</span>;
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-red" style={{ marginBottom: '8px' }}>
            <ShieldAlert size={12} /> TAIL-RISK STRESS LAB
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Algorithmic Strategy Stress Testing</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Expose trading models to liquidity shocks, extreme slippage multipliers, and historical black swan drawdowns.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            {['BTC-USD', 'GLD', 'NVDA', 'SPY', 'ETH-USD'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <button onClick={runStress} className="btn-cyan" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            <Play size={14} /> Re-run Stress Suite
          </button>
        </div>
      </div>

      {/* Fragility Score & Base Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{
          padding: '20px',
          borderLeft: `4px solid ${fragility_score < 40 ? 'var(--accent-green)' : (fragility_score < 65 ? 'var(--accent-amber)' : 'var(--accent-red)')}`,
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            FRAGILITY COEFFICIENT (0-100)
          </div>
          <div className="mono" style={{ fontSize: '2rem', fontWeight: '800', color: fragility_score < 40 ? 'var(--accent-green)' : (fragility_score < 65 ? 'var(--accent-amber)' : 'var(--accent-red)') }}>
            {fragility_score}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {fragility_score < 40 ? 'Robust capital preservation' : 'Sensitive to liquidity freeze'}
          </div>
        </div>

        <MetricCard
          title="BASE RETURN"
          value={`${base_return >= 0 ? '+' : ''}${base_return}%`}
          subtitle="Unstressed reference model"
          isPositive={base_return >= 0}
        />
        <MetricCard
          title="BASE SHARPE RATIO"
          value={base_sharpe}
          subtitle="Risk-adjusted hurdle"
        />
        <MetricCard
          title="BASE MAX DRAWDOWN"
          value={`-${base_drawdown}%`}
          subtitle="Baseline equity impairment"
        />
      </div>

      {/* Executive Stress Summary */}
      <div className="glass-panel" style={{ padding: '18px 22px', background: 'rgba(255, 51, 102, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>
          <AlertTriangle size={16} /> STRESS TEST EXECUTIVE CONCLUSION
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {summary}
        </div>
      </div>

      {/* Scenarios Grid */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>
          Historical Crisis & Adverse Execution Scenarios
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {scenarios.map((sc, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{sc.scenario_name}</h4>
                {getStatusBadge(sc.status)}
              </div>

              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                {sc.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NET RETURN</div>
                  <div className="mono" style={{ fontSize: '1rem', fontWeight: '700', color: sc.total_return_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {sc.total_return_pct >= 0 ? `+${sc.total_return_pct}%` : `${sc.total_return_pct}%`}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MAX DRAWDOWN</div>
                  <div className="mono" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-red)' }}>
                    -{sc.max_drawdown_pct}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Fee Friction Sensitivity Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>
          Transaction Fee Drag Sensitivity Matrix
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Evaluates how institutional fee increases from 0 bps to 50 bps erode strategy net alpha
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {cost_sensitivity.map((cs) => (
            <div key={cs.fee_bps} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                {cs.fee_bps} BPS FEE
              </div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', margin: '6px 0', color: cs.net_return_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {cs.net_return_pct >= 0 ? `+${cs.net_return_pct}%` : `${cs.net_return_pct}%`}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Sharpe: {cs.sharpe}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

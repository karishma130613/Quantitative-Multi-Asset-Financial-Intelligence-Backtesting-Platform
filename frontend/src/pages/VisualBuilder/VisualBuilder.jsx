import React, { useState } from 'react';
import { api } from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import { ErrorState } from '../../components/common/LoadingSkeleton';
import { 
  Workflow, Plus, Trash2, Play, CheckCircle, 
  ArrowRight, Sliders, Shield, Zap 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VisualBuilder({ onNavigate, onOpenDetective }) {
  const [asset, setAsset] = useState('BTC-USD');
  const [operator, setOperator] = useState('AND');
  const [conditions, setConditions] = useState([
    { indicator_left: 'price', operator: '>', indicator_right: 'sma_20' },
    { indicator_left: 'momentum_14', operator: '>', indicator_right: 'value_0' },
  ]);
  const [actionThen, setActionThen] = useState('BUY 100%');
  const [actionElse, setActionElse] = useState('HOLD CASH (0%)');

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const indicatorOptions = [
    { label: 'Spot Price', value: 'price' },
    { label: '20-Day SMA', value: 'sma_20' },
    { label: '50-Day SMA', value: 'sma_50' },
    { label: '200-Day SMA', value: 'sma_200' },
    { label: '20-Day EMA', value: 'ema_20' },
    { label: '14-Day Momentum', value: 'momentum_14' },
    { label: '20-Day Volatility', value: 'volatility_20' },
    { label: 'Zero Level (0.0)', value: 'value_0' },
    { label: 'Hurdle (2%)', value: 'value_0.02' },
  ];

  const compareOps = ['>', '>=', '<', '<=', '=='];

  const addCondition = () => {
    setConditions([
      ...conditions,
      { indicator_left: 'sma_20', operator: '>', indicator_right: 'sma_50' },
    ]);
  };

  const removeCondition = (idx) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx, field, value) => {
    const next = [...conditions];
    next[idx][field] = value;
    setConditions(next);
  };

  const handleRunVisualStrategy = async () => {
    setRunning(true);
    setError(null);
    try {
      const resp = await api.strategy.runVisualBacktest({
        asset,
        strategy_type: 'custom_visual',
        custom_rules: {
          operator,
          conditions,
          action_then: actionThen,
          action_else: actionElse,
        },
        initial_capital: 100000,
        position_size_pct: 1.0,
        transaction_cost_bps: 10.0,
        slippage_bps: 5.0,
      });
      setResults(resp);
      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch (e) {}
    } catch (err) {
      setError(err.message || 'Visual strategy execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const metrics = results?.metrics;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-purple" style={{ marginBottom: '8px' }}>
            <Workflow size={12} /> LOGIC COMPILER
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Visual Quantitative Strategy Builder</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Compose rule-based algorithmic trading logic using conditional blocks without writing code.
          </p>
        </div>

        {/* Target Asset selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ASSET:</span>
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
            {['GLD', 'BTC-USD', 'NVDA', 'SPY', 'ETH-USD', 'QQQ', 'AAPL', 'TLT'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Rule Composer Canvas Panel */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Rule Definition Matrix</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Condition Logic:</span>
            <button
              onClick={() => setOperator(operator === 'AND' ? 'OR' : 'AND')}
              style={{
                background: operator === 'AND' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                color: '#000000',
                border: 'none',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              MATCH {operator}
            </button>
          </div>
        </div>

        {/* Condition Blocks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {conditions.map((cond, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                {idx === 0 ? 'IF' : operator}
              </span>

              {/* Indicator Left */}
              <select
                value={cond.indicator_left}
                onChange={(e) => updateCondition(idx, 'indicator_left', e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              >
                {indicatorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Operator */}
              <select
                value={cond.operator}
                onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {compareOps.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>

              {/* Indicator Right */}
              <select
                value={cond.indicator_right}
                onChange={(e) => updateCondition(idx, 'indicator_right', e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              >
                {indicatorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Remove block */}
              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(idx)}
                  style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                  title="Remove condition"
                >
                  <Trash2 size={16} color="var(--accent-red)" />
                </button>
              )}
            </div>
          ))}

          {/* Add condition button */}
          <button
            onClick={addCondition}
            className="btn-secondary"
            style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.78rem' }}
          >
            <Plus size={15} /> Add Condition Block
          </button>
        </div>

        {/* Execution Actions (THEN / ELSE) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ background: 'rgba(0, 223, 143, 0.08)', border: '1px solid rgba(0, 223, 143, 0.25)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '4px' }}>
              THEN EXECUTE:
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>BUY LONG (100% CAPITAL)</div>
          </div>

          <div style={{ background: 'rgba(255, 51, 102, 0.08)', border: '1px solid rgba(255, 51, 102, 0.25)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '4px' }}>
              ELSE EXECUTE:
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>EXIT TO CASH RESERVES (0%)</div>
          </div>
        </div>

        {/* Run button */}
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={handleRunVisualStrategy}
            disabled={running}
            className="btn-cyan"
            style={{ padding: '12px 28px', fontSize: '0.92rem' }}
          >
            <Play size={18} />
            <span>{running ? 'Compiling Rules & Simulating...' : 'Execute Visual Strategy Backtest'}</span>
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={handleRunVisualStrategy} />}

      {/* Visual Builder Results */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <MetricCard
              title="VISUAL STRATEGY RETURN"
              value={`${metrics.total_return_pct >= 0 ? '+' : ''}${metrics.total_return_pct}%`}
              change={`Benchmark: ${metrics.benchmark_return_pct}%`}
              isPositive={metrics.total_return_pct >= metrics.benchmark_return_pct}
              subtitle={`Final Capital: $${metrics.final_capital?.toLocaleString()}`}
            />
            <MetricCard
              title="ANNUALIZED SHARPE"
              value={metrics.sharpe_ratio}
              change={`Benchmark: ${metrics.benchmark_sharpe_ratio}`}
              isPositive={metrics.sharpe_ratio >= metrics.benchmark_sharpe_ratio}
            />
            <MetricCard
              title="MAX DRAWDOWN"
              value={`-${metrics.max_drawdown_pct}%`}
              isPositive={metrics.max_drawdown_pct <= metrics.benchmark_max_drawdown_pct}
              subtitle={`Benchmark: -${metrics.benchmark_max_drawdown_pct}%`}
            />
            <MetricCard
              title="TOTAL TRADES"
              value={metrics.total_trades}
              subtitle={`Win Rate: ${metrics.win_rate_pct}%`}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                if (onOpenDetective) onOpenDetective(results);
                onNavigate('strategy-detective');
              }}
              className="btn-purple"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              Analyze in Strategy Detective →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import { 
  Play, FlaskConical, Sliders, DollarSign, Percent, 
  RotateCcw, Save, SearchCheck, CheckCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StrategyLab({ 
  initialAsset = 'BTC-USD', 
  onNavigate, 
  onSaveExperiment, 
  onOpenDetective 
}) {
  const [asset, setAsset] = useState(initialAsset);
  const [strategyType, setStrategyType] = useState('sma_crossover');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [positionSizePct, setPositionSizePct] = useState(1.0);
  const [transactionCostBps, setTransactionCostBps] = useState(10.0);
  const [slippageBps, setSlippageBps] = useState(5.0);

  // Strategy parameters
  const [fastPeriod, setFastPeriod] = useState(20);
  const [slowPeriod, setSlowPeriod] = useState(50);
  const [momentumPeriod, setMomentumPeriod] = useState(14);
  const [lookbackPeriod, setLookbackPeriod] = useState(20);

  // Execution state & Progress Animation
  const [running, setRunning] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Trade log filter
  const [tradeFilter, setTradeFilter] = useState('ALL'); // ALL, WIN, LOSS

  const equityCanvasRef = useRef(null);

  const strategies = [
    { id: 'sma_crossover', name: 'Dual SMA Crossover', desc: 'Fast SMA crosses above slow SMA for trend momentum.' },
    { id: 'ema_trend', name: 'EMA Momentum Trend', desc: 'Fast-reacting exponential moving average trend participation.' },
    { id: 'momentum', name: 'Time-Series Momentum', desc: 'Systematic allocations based on trailing relative strength.' },
    { id: 'mean_reversion', name: 'Mean Reversion (Bollinger)', desc: 'Buy extreme downside statistical standard deviations.' },
  ];

  const assets = ['GLD', 'BTC-USD', 'NVDA', 'SPY', 'ETH-USD', 'QQQ', 'AAPL', 'TLT'];

  const handleRunExperiment = async () => {
    setRunning(true);
    setError(null);
    setSavedSuccess(false);

    // Multi-stage progress animation
    setProgressStage('Compiling Signal Logic & Risk Filters...');
    await new Promise((r) => setTimeout(r, 450));

    setProgressStage('Simulating Realistic Portfolio Execution & Slippage...');
    await new Promise((r) => setTimeout(r, 450));

    setProgressStage('Generating Forensic Performance Diagnostics...');

    try {
      const resp = await api.strategy.runBacktest({
        asset,
        strategy_type: strategyType,
        initial_capital: Number(initialCapital),
        position_size_pct: Number(positionSizePct),
        transaction_cost_bps: Number(transactionCostBps),
        slippage_bps: Number(slippageBps),
        fast_period: Number(fastPeriod),
        slow_period: Number(slowPeriod),
        momentum_period: Number(momentumPeriod),
        lookback_period: Number(lookbackPeriod),
      });

      setResults(resp);
      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
      } catch (e) {
        // Confetti polish optional
      }
    } catch (err) {
      setError(err.message || 'Backtesting engine calculation error.');
    } finally {
      setRunning(false);
      setProgressStage('');
    }
  };

  // Run automatically once on mount
  useEffect(() => {
    handleRunExperiment();
  }, []);

  // Render Equity Curve Comparison Chart
  useEffect(() => {
    if (!results || !results.equity_curve || results.equity_curve.length === 0) return;
    const canvas = equityCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth || 800);
    const height = (canvas.height = 300);

    ctx.clearRect(0, 0, width, height);

    const curve = results.equity_curve;
    const n = curve.length;

    const stratVals = curve.map((c) => c.portfolio_value);
    const benchVals = curve.map((c) => c.benchmark_value);

    const allVals = [...stratVals, ...benchVals];
    const minVal = Math.min(...allVals) * 0.95;
    const maxVal = Math.max(...allVals) * 1.05;
    const vRange = maxVal - minVal || 1;

    const getX = (i) => (i / (n - 1)) * (width - 80) + 15;
    const getY = (val) => height - 30 - ((val - minVal) / vRange) * (height - 50);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = 20 + i * ((height - 50) / 3);
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(width - 70, y);
      ctx.stroke();

      const valAtY = maxVal - (i / 3) * vRange;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(`$${(valAtY / 1000).toFixed(0)}k`, width - 65, y + 3);
    }

    // Benchmark Line (Gray/Muted)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(getX(0), getY(benchVals[0]));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(benchVals[i]));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Strategy Area Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(stratVals[0]));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(stratVals[i]));
    }
    ctx.lineTo(getX(n - 1), height - 30);
    ctx.lineTo(getX(0), height - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Strategy Line (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.4;
    ctx.moveTo(getX(0), getY(stratVals[0]));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(stratVals[i]));
    }
    ctx.stroke();

    // Date X-axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    [0, Math.floor(n / 2), n - 1].forEach((idx) => {
      ctx.fillText(curve[idx].date, getX(idx), height - 10);
    });

  }, [results]);

  const handleSave = async () => {
    if (!results) return;
    try {
      await api.experiments.save({
        name: `${asset} ${strategyType.toUpperCase()} Backtest`,
        asset,
        strategy_name: strategyType,
        parameters: {
          fastPeriod,
          slowPeriod,
          momentumPeriod,
          lookbackPeriod,
          initialCapital,
          positionSizePct,
          transactionCostBps,
          slippageBps,
        },
        metrics: results.metrics,
        equity_curve: results.equity_curve.slice(0, 50),
        trade_count: results.metrics.total_trades,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save experiment: ' + err.message);
    }
  };

  const metrics = results?.metrics || {};
  const trades = results?.trades || [];

  const filteredTrades = trades.filter((t) => {
    if (tradeFilter === 'WIN') return t.pnl > 0;
    if (tradeFilter === 'LOSS') return t.pnl <= 0;
    return true;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            <FlaskConical size={12} /> EXPERIMENTAL QUANTITATIVE LAB
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Algorithmic Strategy Backtesting Lab</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Vectorized strategy execution with transaction cost drag, realistic slippage, and Buy & Hold benchmarking.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {results && (
            <button onClick={handleSave} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
              <Save size={15} color={savedSuccess ? 'var(--accent-green)' : 'var(--text-primary)'} />
              <span>{savedSuccess ? 'Archived!' : 'Save Experiment'}</span>
            </button>
          )}
          <button
            onClick={() => {
              if (onOpenDetective) onOpenDetective(results);
              onNavigate('strategy-detective');
            }}
            className="btn-purple"
            style={{ fontSize: '0.82rem' }}
          >
            <SearchCheck size={16} /> Strategy Detective →
          </button>
        </div>
      </div>

      {/* Strategy Selector Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {strategies.map((s) => (
          <div
            key={s.id}
            onClick={() => setStrategyType(s.id)}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: strategyType === s.id ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-card)',
              border: '1px solid',
              borderColor: strategyType === s.id ? 'var(--accent-cyan)' : 'var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: strategyType === s.id ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: '4px' }}>
              {s.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration & Parameters Drawer */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sliders size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '0.92rem', fontWeight: '700' }}>Portfolio & Execution Parameters</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {/* Target Asset */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              TARGET ASSET
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            >
              {assets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Initial Capital */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              INITIAL CAPITAL ($)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Position Sizing */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              POSITION SIZE ({Math.round(positionSizePct * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={positionSizePct}
              onChange={(e) => setPositionSizePct(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', marginTop: '8px' }}
            />
          </div>

          {/* Transaction Cost */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              TRANSACTION COST: {transactionCostBps} BPS
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={transactionCostBps}
              onChange={(e) => setTransactionCostBps(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-amber)', marginTop: '8px' }}
            />
          </div>

          {/* Slippage */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              SLIPPAGE: {slippageBps} BPS
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={slippageBps}
              onChange={(e) => setSlippageBps(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-red)', marginTop: '8px' }}
            />
          </div>

          {/* Strategy Specific Param 1 */}
          {(strategyType === 'sma_crossover' || strategyType === 'ema_trend') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                FAST MA PERIOD ({fastPeriod} BARS)
              </label>
              <input
                type="number"
                value={fastPeriod}
                onChange={(e) => setFastPeriod(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          )}

          {/* Strategy Specific Param 2 */}
          {(strategyType === 'sma_crossover' || strategyType === 'ema_trend') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                SLOW MA PERIOD ({slowPeriod} BARS)
              </label>
              <input
                type="number"
                value={slowPeriod}
                onChange={(e) => setSlowPeriod(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          )}

          {strategyType === 'momentum' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                MOMENTUM LOOKBACK ({momentumPeriod} BARS)
              </label>
              <input
                type="number"
                value={momentumPeriod}
                onChange={(e) => setMomentumPeriod(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          )}

          {strategyType === 'mean_reversion' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                BOLLINGER WINDOW ({lookbackPeriod} BARS)
              </label>
              <input
                type="number"
                value={lookbackPeriod}
                onChange={(e) => setLookbackPeriod(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          )}
        </div>

        {/* RUN EXPERIMENT BUTTON WITH ANIMATION */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleRunExperiment}
            disabled={running}
            className="btn-cyan"
            style={{ padding: '12px 28px', fontSize: '0.92rem', borderRadius: '10px' }}
          >
            <Play size={18} />
            <span>{running ? 'COMPUTING SIMULATION...' : 'RUN EXPERIMENT'}</span>
          </button>

          {running && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>
              <div className="pulse-dot" />
              <span>{progressStage}</span>
            </div>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={handleRunExperiment} />}

      {/* RESULTS VIEW */}
      {results && (
        <>
          {/* Strategy vs Benchmark Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <MetricCard
              title="STRATEGY TOTAL RETURN"
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
              subtitle={`Sortino: ${metrics.sortino_ratio}`}
            />
            <MetricCard
              title="MAX DRAWDOWN"
              value={`-${metrics.max_drawdown_pct}%`}
              change={`Benchmark: -${metrics.benchmark_max_drawdown_pct}%`}
              isPositive={metrics.max_drawdown_pct <= metrics.benchmark_max_drawdown_pct}
              subtitle="Underwater peak-to-trough"
            />
            <MetricCard
              title="WIN RATE & PROFIT FACTOR"
              value={`${metrics.win_rate_pct}%`}
              change={`Profit Factor: ${metrics.profit_factor}`}
              isPositive={metrics.profit_factor >= 1.0}
              subtitle={`${metrics.total_trades} trades (${metrics.winning_trades}W / ${metrics.losing_trades}L)`}
            />
          </div>

          {/* Equity Curve Comparison Chart */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Portfolio Equity Trajectory</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Strategy Net Portfolio Curve (Cyan) vs Buy & Hold Benchmark (Dashed Gray)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '3px', background: 'var(--accent-cyan)' }} />
                  <span>Strategy ($100k start)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', borderTop: '2px dashed var(--text-muted)' }} />
                  <span>Buy & Hold Benchmark</span>
                </div>
                <span className="badge badge-amber mono">
                  Friction: ${metrics.total_fees_paid?.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '300px', position: 'relative' }}>
              <canvas ref={equityCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>

          {/* Monthly Returns Heatmap */}
          {results?.monthly_returns && Object.keys(results.monthly_returns).length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Monthly Returns Heatmap</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Calendar view of strategy returns by month — green = positive, red = negative
                </p>
              </div>

              {(() => {
                const monthlyData = results.monthly_returns;
                const keys = Object.keys(monthlyData).sort();
                const years = [...new Set(keys.map(k => k.split('-')[0]))];
                const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

                const getColor = (val) => {
                  if (val === null || val === undefined) return 'var(--bg-tertiary)';
                  if (val > 10) return 'rgba(0, 223, 143, 0.85)';
                  if (val > 5) return 'rgba(0, 223, 143, 0.6)';
                  if (val > 2) return 'rgba(0, 223, 143, 0.35)';
                  if (val > 0) return 'rgba(0, 223, 143, 0.18)';
                  if (val > -2) return 'rgba(255, 51, 102, 0.18)';
                  if (val > -5) return 'rgba(255, 51, 102, 0.35)';
                  if (val > -10) return 'rgba(255, 51, 102, 0.6)';
                  return 'rgba(255, 51, 102, 0.85)';
                };

                const getTextColor = (val) => {
                  if (val === null || val === undefined) return 'var(--text-muted)';
                  return Math.abs(val) > 5 ? '#ffffff' : 'var(--text-primary)';
                };

                return (
                  <div style={{ minWidth: '600px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600' }}>YEAR</th>
                          {monthNames.map((m) => (
                            <th key={m} style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>{m}</th>
                          ))}
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>ANN.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {years.map((year) => {
                          const yearVals = months.map(m => monthlyData[`${year}-${m}`] ?? null);
                          const validVals = yearVals.filter(v => v !== null);
                          const annualReturn = validVals.length > 0
                            ? validVals.reduce((acc, v) => acc * (1 + v / 100), 1) - 1
                            : null;
                          return (
                            <tr key={year}>
                              <td style={{ padding: '4px 10px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{year}</td>
                              {yearVals.map((val, mi) => (
                                <td
                                  key={mi}
                                  style={{
                                    padding: '4px',
                                    textAlign: 'center',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: '600',
                                  }}
                                >
                                  {val !== null ? (
                                    <div style={{
                                      background: getColor(val),
                                      color: getTextColor(val),
                                      padding: '5px 2px',
                                      borderRadius: '5px',
                                      fontSize: '0.72rem',
                                    }}>
                                      {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                                    </div>
                                  ) : (
                                    <div style={{ padding: '5px 2px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</div>
                                  )}
                                </td>
                              ))}
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                {annualReturn !== null ? (
                                  <div style={{
                                    background: getColor(annualReturn * 100),
                                    color: getTextColor(annualReturn * 100),
                                    padding: '5px 4px',
                                    borderRadius: '5px',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: '700',
                                    fontSize: '0.72rem',
                                  }}>
                                    {annualReturn >= 0 ? `+${(annualReturn * 100).toFixed(1)}` : (annualReturn * 100).toFixed(1)}%
                                  </div>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Scale:</span>
                      {[['> +10%', 'rgba(0,223,143,0.85)'], ['+5%', 'rgba(0,223,143,0.6)'], ['+2%', 'rgba(0,223,143,0.35)'], ['0%', 'var(--bg-tertiary)'], ['-2%', 'rgba(255,51,102,0.35)'], ['-5%', 'rgba(255,51,102,0.6)'], ['< -10%', 'rgba(255,51,102,0.85)']].map(([label, bg]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: bg }} />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Detailed Trade Log Table */}
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Execution Trade Blotter</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Complete chronological simulation of entries, exits, realized PnL, and roundtrip commissions
                </p>
              </div>

              {/* Trade filters */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'WIN', 'LOSS'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTradeFilter(f)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: tradeFilter === f ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                      color: tradeFilter === f ? '#000000' : 'var(--text-muted)',
                      fontWeight: '600',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>ENTRY DATE</th>
                  <th style={{ padding: '8px' }}>EXIT DATE</th>
                  <th style={{ padding: '8px' }}>ENTRY PRICE</th>
                  <th style={{ padding: '8px' }}>EXIT PRICE</th>
                  <th style={{ padding: '8px' }}>POSITION</th>
                  <th style={{ padding: '8px' }}>PNL ($)</th>
                  <th style={{ padding: '8px' }}>RETURN</th>
                  <th style={{ padding: '8px' }}>FEES</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.slice(0, 25).map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{t.id}</td>
                    <td style={{ padding: '8px' }}>{t.entry_date}</td>
                    <td style={{ padding: '8px' }}>{t.exit_date}</td>
                    <td className="mono" style={{ padding: '8px' }}>${t.entry_price}</td>
                    <td className="mono" style={{ padding: '8px' }}>${t.exit_price}</td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{t.position}</span>
                    </td>
                    <td className="mono" style={{
                      padding: '8px',
                      fontWeight: '600',
                      color: t.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {t.pnl >= 0 ? `+$${t.pnl.toLocaleString()}` : `-$${Math.abs(t.pnl).toLocaleString()}`}
                    </td>
                    <td className="mono" style={{
                      padding: '8px',
                      fontWeight: '600',
                      color: t.pnl_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {t.pnl_pct >= 0 ? `+${t.pnl_pct}%` : `${t.pnl_pct}%`}
                    </td>
                    <td className="mono" style={{ padding: '8px', color: 'var(--text-muted)' }}>
                      ${t.fee_paid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

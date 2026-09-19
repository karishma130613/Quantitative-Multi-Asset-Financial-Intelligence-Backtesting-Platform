import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import MetricCard from '../../components/common/MetricCard';
import { 
  LineChart, TrendingUp, Calendar, Layers, Activity, 
  Eye, CheckSquare, Square, ArrowUpRight, ArrowDownRight,
  CloudSun, BarChart2
} from 'lucide-react';

export default function MarketExplorer({ defaultAsset = 'BTC-USD', onNavigate, onLaunchBacktest }) {
  const [selectedAsset, setSelectedAsset] = useState(defaultAsset);
  const [timeframe, setTimeframe] = useState('3Y'); // 1Y, 3Y, 5Y, All
  const [historyData, setHistoryData] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overlays
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showDrawdown, setShowDrawdown] = useState(true);

  const canvasRef = useRef(null);
  const ddCanvasRef = useRef(null);

  const getStartDate = (tf) => {
    const now = new Date();
    if (tf === '1Y') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    if (tf === '3Y') return new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    if (tf === '5Y') return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    return '2020-01-01';
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsResp, histResp] = await Promise.all([
        api.market.getAssets(),
        api.market.getHistory(selectedAsset, getStartDate(timeframe)),
      ]);
      setAssetsList(assetsResp);
      setHistoryData(histResp.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load market history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAsset, timeframe]);

  // High performance Canvas Chart Rendering for Main Price & Moving Averages
  useEffect(() => {
    if (!historyData || historyData.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth || 800);
    const height = (canvas.height = 320);

    ctx.clearRect(0, 0, width, height);

    const prices = historyData.map(d => d.close);
    const minP = Math.min(...prices) * 0.96;
    const maxP = Math.max(...prices) * 1.04;
    const pRange = maxP - minP || 1;

    const n = historyData.length;
    const getX = (i) => (i / (n - 1)) * (width - 70) + 10;
    const getY = (val) => height - 30 - ((val - minP) / pRange) * (height - 50);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = 20 + i * ((height - 50) / 3);
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();

      const priceAtY = maxP - (i / 3) * pRange;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(`$${priceAtY.toFixed(1)}`, width - 55, y + 3);
    }

    // Draw Price Gradient Area
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(prices[i]));
    }
    ctx.lineTo(getX(n - 1), height - 30);
    ctx.lineTo(getX(0), height - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Main Price Line
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(prices[i]));
    }
    ctx.stroke();

    // Overlay: SMA 20 (Emerald)
    if (showSMA20) {
      ctx.beginPath();
      ctx.strokeStyle = '#00df8f';
      ctx.lineWidth = 1.4;
      let started = false;
      for (let i = 0; i < n; i++) {
        if (historyData[i].sma_20) {
          const y = getY(historyData[i].sma_20);
          if (!started) { ctx.moveTo(getX(i), y); started = true; }
          else { ctx.lineTo(getX(i), y); }
        }
      }
      ctx.stroke();
    }

    // Overlay: SMA 50 (Amber)
    if (showSMA50) {
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      let started = false;
      for (let i = 0; i < n; i++) {
        if (historyData[i].sma_50) {
          const y = getY(historyData[i].sma_50);
          if (!started) { ctx.moveTo(getX(i), y); started = true; }
          else { ctx.lineTo(getX(i), y); }
        }
      }
      ctx.stroke();
    }

    // Overlay: EMA 20 (Violet)
    if (showEMA20) {
      ctx.beginPath();
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 1.4;
      let started = false;
      for (let i = 0; i < n; i++) {
        if (historyData[i].ema_20) {
          const y = getY(historyData[i].ema_20);
          if (!started) { ctx.moveTo(getX(i), y); started = true; }
          else { ctx.lineTo(getX(i), y); }
        }
      }
      ctx.stroke();
    }

    // Date X-axis marks
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    const numDates = Math.min(5, n);
    for (let k = 0; k < numDates; k++) {
      const idx = Math.floor((k / (numDates - 1)) * (n - 1));
      ctx.fillText(historyData[idx].date, getX(idx), height - 10);
    }

  }, [historyData, showSMA20, showSMA50, showEMA20]);

  // Underwater Drawdown Chart Rendering
  useEffect(() => {
    if (!historyData || historyData.length === 0 || !showDrawdown) return;
    const canvas = ddCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth || 800);
    const height = (canvas.height = 110);

    ctx.clearRect(0, 0, width, height);

    const drawdowns = historyData.map(d => (d.drawdown ? d.drawdown * 100 : 0));
    const minDD = Math.min(...drawdowns, -5); // e.g. -45%
    const n = historyData.length;

    const getX = (i) => (i / (n - 1)) * (width - 70) + 10;
    const getY = (val) => 15 + ((val - 0) / (minDD - 0)) * (height - 30);

    // Area fill
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(0));
    for (let i = 0; i < n; i++) {
      ctx.lineTo(getX(i), getY(drawdowns[i]));
    }
    ctx.lineTo(getX(n - 1), getY(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 51, 102, 0.2)';
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 1.5;
    ctx.moveTo(getX(0), getY(drawdowns[0]));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(drawdowns[i]));
    }
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255, 51, 102, 0.7)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('0%', width - 55, 20);
    ctx.fillText(`${minDD.toFixed(1)}%`, width - 55, height - 15);

  }, [historyData, showDrawdown]);

  const currentAssetMeta = assetsList.find(a => a.symbol === selectedAsset) || {};
  const lastBar = historyData[historyData.length - 1] || {};

  if (loading && historyData.length === 0) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton height="60px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <LoadingSkeleton height="100px" />
          <LoadingSkeleton height="100px" />
          <LoadingSkeleton height="100px" />
          <LoadingSkeleton height="100px" />
        </div>
        <LoadingSkeleton height="360px" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Asset Selector Header Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {assetsList.map((a) => (
            <button
              key={a.symbol}
              onClick={() => setSelectedAsset(a.symbol)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedAsset === a.symbol ? 'var(--accent-cyan)' : 'var(--border-color)',
                background: selectedAsset === a.symbol ? 'rgba(0, 240, 255, 0.15)' : 'var(--bg-tertiary)',
                color: selectedAsset === a.symbol ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {a.name} ({a.symbol.split('-')[0]})
            </button>
          ))}
        </div>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {['1Y', '3Y', '5Y', 'ALL'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: timeframe === tf ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                color: timeframe === tf ? '#000000' : 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Overlay for chart refresh */}
      {loading && historyData.length > 0 && (
        <div style={{ position: 'fixed', bottom: '80px', right: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', zIndex: 40 }}>
          <div className="pulse-dot" />
          <span>Refreshing chart data...</span>
        </div>
      )}

      {/* Main Asset Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard
          title="SPOT PRICE"
          value={`$${lastBar.close?.toLocaleString() || currentAssetMeta.current_price?.toLocaleString() || '0.00'}`}
          change={currentAssetMeta.change_24h_pct != null ? `${currentAssetMeta.change_24h_pct >= 0 ? '+' : ''}${currentAssetMeta.change_24h_pct}%` : null}
          isPositive={currentAssetMeta.change_24h_pct >= 0}
          subtitle={`Symbol: ${selectedAsset}`}
          icon={BarChart2}
        />
        <MetricCard
          title="ANNUALIZED VOLATILITY"
          value={`${currentAssetMeta.annualized_volatility || '0.0'}%`}
          subtitle="Realized 252-day basis"
          icon={Activity}
        />
        <MetricCard
          title="ANNUALIZED SHARPE"
          value={currentAssetMeta.sharpe_ratio || '0.0'}
          change={currentAssetMeta.sharpe_ratio > 1 ? 'Above hurdle' : 'Below hurdle'}
          isPositive={currentAssetMeta.sharpe_ratio > 1}
          subtitle="Risk-free hurdle: 4%"
          icon={TrendingUp}
        />
        <MetricCard
          title="MAX HISTORICAL DRAWDOWN"
          value={`-${currentAssetMeta.max_drawdown || '0.0'}%`}
          subtitle="Underwater peak-to-trough"
        />
      </div>

      {/* Regime & Return Summary Row */}
      {currentAssetMeta.current_regime && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <MetricCard
            title="CURRENT ML REGIME"
            value={(() => {
              const emojis = { 'Bull Market': '☀️', 'Bear Market': '🌧️', 'Sideways Market': '🌫️', 'High Volatility': '⛈️' };
              return `${emojis[currentAssetMeta.current_regime] || '📊'} ${currentAssetMeta.current_regime}`;
            })()}
            subtitle="K-Means unsupervised ML classification"
            icon={CloudSun}
          />
          <MetricCard
            title="ANNUALIZED RETURN"
            value={`${currentAssetMeta.annualized_return >= 0 ? '+' : ''}${currentAssetMeta.annualized_return || '0.0'}%`}
            isPositive={currentAssetMeta.annualized_return >= 0}
            subtitle={`Selected period: ${timeframe}`}
            icon={TrendingUp}
          />
          <MetricCard
            title="DATASET BARS"
            value={historyData.length.toLocaleString()}
            subtitle={`From ${historyData[0]?.date || 'N/A'} to ${historyData[historyData.length - 1]?.date || 'N/A'}`}
            icon={Calendar}
          />
          <MetricCard
            title="LAST CLOSE"
            value={`$${lastBar.close?.toLocaleString() || '0.00'}`}
            change={lastBar.returns != null ? `${lastBar.returns >= 0 ? '+' : ''}${(lastBar.returns * 100).toFixed(2)}% daily` : null}
            isPositive={lastBar.returns >= 0}
            subtitle={`As of ${lastBar.date || 'N/A'}`}
          />
        </div>
      )}

      {/* Main Price Canvas Chart Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Chart Header & Indicator Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              {currentAssetMeta.name || selectedAsset} — Technical Architecture
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Historical daily OHLCV series with moving average envelopes & rolling volatility
            </p>
          </div>

          {/* Overlays toggle buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showSMA20 ? 'rgba(0, 223, 143, 0.15)' : 'var(--bg-tertiary)',
                color: showSMA20 ? 'var(--accent-green)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />
              <span>SMA 20</span>
            </button>

            <button
              onClick={() => setShowSMA50(!showSMA50)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showSMA50 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
                color: showSMA50 ? 'var(--accent-amber)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
              <span>SMA 50</span>
            </button>

            <button
              onClick={() => setShowEMA20(!showEMA20)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showEMA20 ? 'rgba(157, 78, 221, 0.15)' : 'var(--bg-tertiary)',
                color: showEMA20 ? 'var(--accent-purple)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
              <span>EMA 20</span>
            </button>

            <button
              onClick={() => setShowDrawdown(!showDrawdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showDrawdown ? 'rgba(255, 51, 102, 0.15)' : 'var(--bg-tertiary)',
                color: showDrawdown ? 'var(--accent-red)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)' }} />
              <span>Drawdown</span>
            </button>

            {/* Action to launch backtest directly */}
            <button
              onClick={() => {
                if (onLaunchBacktest) onLaunchBacktest(selectedAsset);
                onNavigate('strategy-lab');
              }}
              className="btn-cyan"
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
            >
              Backtest {selectedAsset.split('-')[0]} →
            </button>
          </div>
        </div>

        {/* Primary Chart Canvas */}
        <div style={{ width: '100%', height: '320px', position: 'relative' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Underwater Drawdown Chart */}
        {showDrawdown && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-red)' }}>
                UNDERWATER EQUITY DRAWDOWN (%)
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Capital impairment from all-time highs
              </span>
            </div>
            <div style={{ width: '100%', height: '110px', position: 'relative' }}>
              <canvas ref={ddCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

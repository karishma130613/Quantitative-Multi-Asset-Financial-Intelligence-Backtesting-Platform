import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import MetricCard from '../../components/common/MetricCard';
import { 
  CloudSun, Sun, CloudRain, CloudFog, CloudLightning, 
  Calendar, Sliders, Play, Pause, RotateCcw, Info 
} from 'lucide-react';

export default function MarketWeather({ defaultAsset = 'BTC-USD', onNavigate }) {
  const [asset, setAsset] = useState(defaultAsset);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeline scrubber index
  const [scrubberIndex, setScrubberIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const timelineCanvasRef = useRef(null);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.weather.getTimeline(asset, '2021-01-01');
      setData(resp);
      if (resp.timeline && resp.timeline.length > 0) {
        setScrubberIndex(resp.timeline.length - 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate historical market weather.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [asset]);

  // Auto-play timeline animation
  useEffect(() => {
    let timer;
    if (isPlaying && data && data.timeline) {
      timer = setInterval(() => {
        setScrubberIndex((prev) => {
          if (prev >= data.timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isPlaying, data]);

  // Render Historical Weather Ribbon Canvas
  useEffect(() => {
    if (!data || !data.timeline || data.timeline.length === 0) return;
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth || 800);
    const height = (canvas.height = 140);

    ctx.clearRect(0, 0, width, height);

    const timeline = data.timeline;
    const n = timeline.length;
    const barWidth = width / n;

    // Draw regime colored vertical bands
    for (let i = 0; i < n; i++) {
      const point = timeline[i];
      let color = 'rgba(0, 240, 255, 0.4)';
      if (point.regime_code === 0) color = 'rgba(0, 223, 143, 0.55)'; // Bull ☀️
      else if (point.regime_code === 1) color = 'rgba(255, 51, 102, 0.55)'; // Bear 🌧️
      else if (point.regime_code === 2) color = 'rgba(148, 163, 184, 0.4)'; // Sideways 🌫️
      else if (point.regime_code === 3) color = 'rgba(245, 158, 11, 0.6)'; // High Vol ⛈️

      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, 10, barWidth + 0.5, 45);
    }

    // Draw Price curve across ribbon
    const prices = timeline.map((t) => t.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pRange = maxP - minP || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < n; i++) {
      const x = i * barWidth + barWidth / 2;
      const y = height - 20 - ((prices[i] - minP) / pRange) * 55;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Current Scrubber Position Cursor
    const currX = scrubberIndex * barWidth + barWidth / 2;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(currX, 0);
    ctx.lineTo(currX, height);
    ctx.stroke();

    // Dot at price point
    const currPrice = prices[scrubberIndex] || prices[0];
    const currY = height - 20 - ((currPrice - minP) / pRange) * 55;
    ctx.beginPath();
    ctx.arc(currX, currY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [data, scrubberIndex]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton height="100px" />
        <LoadingSkeleton height="300px" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadWeather} />;
  }

  const timeline = data?.timeline || [];
  const currentPoint = timeline[scrubberIndex] || data?.current_weather || {};
  const distribution = data?.distribution || {};

  const getWeatherIconComponent = (code) => {
    switch (code) {
      case 0: return <Sun size={42} color="var(--accent-green)" />;
      case 1: return <CloudRain size={42} color="var(--accent-red)" />;
      case 2: return <CloudFog size={42} color="var(--text-muted)" />;
      case 3: return <CloudLightning size={42} color="var(--accent-amber)" />;
      default: return <CloudSun size={42} color="var(--accent-cyan)" />;
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-amber" style={{ marginBottom: '8px' }}>
            <CloudSun size={12} /> HISTORICAL REGIME CLASSIFICATION
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>🌦️ Market Weather Station</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Unsupervised ML regime classification across historical market regimes. (Historical analysis, not predictive forecasting).
          </p>
        </div>

        {/* Asset Selector */}
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
            {['BTC-USD', 'GLD', 'NVDA', 'SPY', 'ETH-USD', 'QQQ', 'AAPL', 'TLT'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Weather Report Card */}
      <div className="glass-panel" style={{
        padding: '32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.05) 100%)',
      }}>
        {/* Left: Current Weather Condition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '20px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(245, 158, 11, 0.2)',
          }}>
            {getWeatherIconComponent(currentPoint.regime_code)}
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              MARKET WEATHER CONDITION ({currentPoint.date})
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '4px 0' }}>
              {currentPoint.weather_icon} {currentPoint.regime_name}
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              {currentPoint.narrative}
            </div>
          </div>
        </div>

        {/* Right: Real-time Quantitative Telemetry on Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HISTORICAL CLOSE</div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              ${currentPoint.price?.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REALIZED VOLATILITY</div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-amber)' }}>
              {currentPoint.volatility}%
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>24H RETURN</div>
            <div className="mono" style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: currentPoint.daily_return >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {currentPoint.daily_return >= 0 ? `+${currentPoint.daily_return}%` : `${currentPoint.daily_return}%`}
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ML CONFIDENCE</div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {Math.round((currentPoint.confidence || 0.88) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Scrubber Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Historical Timeline Ribbon</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Drag the scrubber to travel through historical dates and observe environmental regime shifts
            </p>
          </div>

          {/* Player controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-cyan"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
            </button>
            <button
              onClick={() => setScrubberIndex(0)}
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Reset to start"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Canvas Visual Ribbon */}
        <div style={{ width: '100%', height: '140px', position: 'relative', marginBottom: '16px' }}>
          <canvas ref={timelineCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Scrubber slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {timeline[0]?.date}
          </span>
          <input
            type="range"
            min="0"
            max={Math.max(0, timeline.length - 1)}
            value={scrubberIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setScrubberIndex(Number(e.target.value));
            }}
            style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {timeline[timeline.length - 1]?.date}
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '18px', fontSize: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-green)' }} />
            <span>☀️ Bull ({Math.round((distribution['Bull Market'] || 0.25) * 100)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-red)' }} />
            <span>🌧️ Bear ({Math.round((distribution['Bear Market'] || 0.25) * 100)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--text-muted)' }} />
            <span>🌫️ Sideways ({Math.round((distribution['Sideways Market'] || 0.25) * 100)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-amber)' }} />
            <span>⛈️ High Vol ({Math.round((distribution['High Volatility'] || 0.25) * 100)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

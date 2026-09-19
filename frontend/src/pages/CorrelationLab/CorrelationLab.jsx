import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import { Network, Activity, Sliders, Calendar, Layers, Info } from 'lucide-react';

export default function CorrelationLab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rollingWindow, setRollingWindow] = useState(60);
  const [selectedPair, setSelectedPair] = useState('GLD / BTC-USD');

  const networkCanvasRef = useRef(null);
  const rollingCanvasRef = useRef(null);

  const loadCorrelation = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.correlation.getMatrix('2021-01-01', null, rollingWindow);
      setData(resp);
      const pairs = Object.keys(resp.rolling_correlation_pairs || {});
      if (pairs.length > 0 && !pairs.includes(selectedPair)) {
        setSelectedPair(pairs[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to compute cross-asset correlation matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCorrelation();
  }, [rollingWindow]);

  // Render Interactive Asset Relationship Network (Nodes & Physics-like Links)
  useEffect(() => {
    if (!data || !data.network_nodes) return;
    const canvas = networkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth || 500);
    const height = (canvas.height = 360);

    const nodes = data.network_nodes;
    const links = data.network_links;
    const n = nodes.length;

    // Arrange nodes in a circular formation
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.36;

    const nodeCoords = nodes.map((node, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    ctx.clearRect(0, 0, width, height);

    // Draw links between nodes
    links.forEach((link) => {
      const src = nodeCoords.find((nc) => nc.id === link.source);
      const tgt = nodeCoords.find((nc) => nc.id === link.target);
      if (!src || !tgt) return;

      const isPositive = link.type === 'positive';
      const alpha = Math.min(0.85, Math.abs(link.weight) * 0.9);
      ctx.strokeStyle = isPositive ? `rgba(0, 240, 255, ${alpha})` : `rgba(255, 51, 102, ${alpha})`;
      ctx.lineWidth = Math.max(1, Math.abs(link.weight) * 3.5);

      ctx.beginPath();
      // Curved quadratic line toward center
      const midX = (src.x + tgt.x) / 2 + (centerX - (src.x + tgt.x) / 2) * 0.2;
      const midY = (src.y + tgt.y) / 2 + (centerY - (src.y + tgt.y) / 2) * 0.2;
      ctx.moveTo(src.x, src.y);
      ctx.quadraticCurveTo(midX, midY, tgt.x, tgt.y);
      ctx.stroke();
    });

    // Draw nodes
    nodeCoords.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(13, 20, 35, 0.95)';
      ctx.strokeStyle = 'var(--accent-cyan)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.split('-')[0], node.x, node.y);
    });

  }, [data]);

  // Render Rolling Correlation Line Chart
  useEffect(() => {
    if (!data || !data.rolling_correlation_pairs) return;
    const series = data.rolling_correlation_pairs[selectedPair];
    if (!series || series.length === 0) return;

    const canvas = rollingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth || 500);
    const height = (canvas.height = 360);

    ctx.clearRect(0, 0, width, height);

    const n = series.length;
    const getX = (i) => (i / (n - 1)) * (width - 70) + 10;
    // Correlation ranges from -1.0 to +1.0
    const getY = (val) => height / 2 - val * (height * 0.38);

    // Draw Zero line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, height / 2);
    ctx.lineTo(width - 60, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid reference marks (+1.0, 0.0, -1.0)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('+1.0', width - 55, getY(1.0) + 4);
    ctx.fillText(' 0.0', width - 55, height / 2 + 4);
    ctx.fillText('-1.0', width - 55, getY(-1.0) + 4);

    // Draw correlation line
    ctx.beginPath();
    ctx.strokeStyle = '#00df8f';
    ctx.lineWidth = 2.2;
    ctx.moveTo(getX(0), getY(series[0].correlation));
    for (let i = 1; i < n; i++) {
      ctx.lineTo(getX(i), getY(series[i].correlation));
    }
    ctx.stroke();

    // Fill under line with subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 223, 143, 0.2)');
    grad.addColorStop(0.5, 'rgba(0, 223, 143, 0.0)');
    grad.addColorStop(1, 'rgba(255, 51, 102, 0.15)');

    ctx.lineTo(getX(n - 1), height / 2);
    ctx.lineTo(getX(0), height / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Date X-axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    [0, Math.floor(n / 2), n - 1].forEach((idx) => {
      ctx.fillText(series[idx].date, getX(idx), height - 12);
    });

  }, [data, selectedPair]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton height="80px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <LoadingSkeleton height="360px" />
          <LoadingSkeleton height="360px" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCorrelation} />;
  }

  const { assets = [], matrix = [] } = data || {};
  const pairsList = Object.keys(data?.rolling_correlation_pairs || {});

  // Function to color matrix cells
  const getCellColor = (val) => {
    if (val > 0) {
      return `rgba(0, 240, 255, ${Math.min(0.85, Math.abs(val) * 0.85)})`;
    } else {
      return `rgba(255, 51, 102, ${Math.min(0.85, Math.abs(val) * 0.85)})`;
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            <Network size={12} /> SPATIAL CROSS-ASSET INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Correlation Lab & Dynamic Network Map</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Empirical correlation matrix, rolling multi-period dynamics, and spatial relationship clustering.
          </p>
        </div>

        {/* Rolling Window Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: '10px' }}>
          <Sliders size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            ROLLING WINDOW: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{rollingWindow} DAYS</span>
          </span>
          <input
            type="range"
            min="20"
            max="180"
            step="10"
            value={rollingWindow}
            onChange={(e) => setRollingWindow(Number(e.target.value))}
            style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Top Half: Network Map & Rolling Correlation Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Spatial Relationship Map */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Asset Relationship Network</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Cyan links = Positive correlation • Red links = Inverse / Diversifier
              </p>
            </div>
            <span className="badge badge-cyan">Interactive WebGL</span>
          </div>

          <div style={{ width: '100%', height: '360px', position: 'relative' }}>
            <canvas ref={networkCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>

        {/* Rolling Correlation Over Time */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Rolling Correlation Dynamics</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Time-varying correlation trajectory ({rollingWindow}-day window)
              </p>
            </div>

            {/* Pair Selector */}
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            >
              {pairsList.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '100%', height: '360px', position: 'relative' }}>
            <canvas ref={rollingCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Bottom Half: Full Interactive Heatmap Matrix */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Empirical Cross-Asset Correlation Matrix</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Pairwise Pearson correlation coefficients calculated from daily log returns
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'left' }}>ASSET</th>
              {assets.map((sym) => (
                <th key={sym} style={{ padding: '10px', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: '700' }}>
                  {sym.split('-')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((rowSym, rIdx) => (
              <tr key={rowSym} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {rowSym.split('-')[0]}
                </td>
                {assets.map((colSym, cIdx) => {
                  const val = matrix[rIdx]?.[cIdx] ?? 0;
                  const isDiag = rIdx === cIdx;
                  return (
                    <td
                      key={colSym}
                      style={{
                        padding: '10px',
                        background: isDiag ? 'var(--bg-tertiary)' : getCellColor(val),
                        color: isDiag ? 'var(--text-muted)' : '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

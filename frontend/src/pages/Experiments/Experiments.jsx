import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingSkeleton, ErrorState } from '../../components/common/LoadingSkeleton';
import MetricCard from '../../components/common/MetricCard';
import { 
  FolderClock, Play, Trash2, Edit2, Check, 
  GitCompare, ArrowRight, ShieldCheck, Calendar, DollarSign 
} from 'lucide-react';

export default function Experiments({ onRerun, onNavigate }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit / rename state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // Compare state
  const [compareIds, setCompareIds] = useState([]);

  const loadExperiments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.experiments.list();
      setExperiments(data);
    } catch (err) {
      setError(err.message || 'Failed to load archived experiments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this experiment record?')) return;
    try {
      await api.experiments.delete(id);
      setExperiments(prev => prev.filter(e => e.id !== id));
      setCompareIds(prev => prev.filter(cid => cid !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleRename = async (id) => {
    if (!editName.trim()) return;
    try {
      await api.experiments.rename(id, editName.trim());
      setExperiments(prev => prev.map(e => (e.id === id ? { ...e, name: editName.trim() } : e)));
      setEditingId(null);
    } catch (err) {
      alert('Rename failed: ' + err.message);
    }
  };

  const toggleCompare = (id) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(cid => cid !== id));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton height="100px" />
        <LoadingSkeleton height="300px" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadExperiments} />;
  }

  const comparedExp1 = experiments.find(e => e.id === compareIds[0]);
  const comparedExp2 = experiments.find(e => e.id === compareIds[1]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            <FolderClock size={12} /> EXPERIMENTAL ARCHIVE
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Quantitative Experiment History</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Institutional memory of past backtest runs, parameters, metrics, and comparisons.
          </p>
        </div>

        <button
          onClick={() => onNavigate('strategy-lab')}
          className="btn-cyan"
          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
        >
          <Play size={15} /> Run New Backtest
        </button>
      </div>

      {/* Side-by-Side Comparison Drawer (if 2 selected) */}
      {comparedExp1 && comparedExp2 && (
        <div className="glass-panel" style={{ padding: '24px', borderColor: 'var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitCompare size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Side-by-Side Strategy Comparison</h3>
            </div>
            <button
              onClick={() => setCompareIds([])}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              Clear Comparison
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Exp 1 */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>{comparedExp1.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{comparedExp1.asset} • {comparedExp1.strategy_name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NET RETURN</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-green)' }}>
                    +{comparedExp1.metrics?.total_return_pct}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SHARPE RATIO</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                    {comparedExp1.metrics?.sharpe_ratio}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MAX DRAWDOWN</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-red)' }}>
                    -{comparedExp1.metrics?.max_drawdown_pct}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>WIN RATE</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                    {comparedExp1.metrics?.win_rate_pct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Exp 2 */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-purple)' }}>{comparedExp2.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{comparedExp2.asset} • {comparedExp2.strategy_name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NET RETURN</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-green)' }}>
                    +{comparedExp2.metrics?.total_return_pct}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SHARPE RATIO</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                    {comparedExp2.metrics?.sharpe_ratio}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MAX DRAWDOWN</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-red)' }}>
                    -{comparedExp2.metrics?.max_drawdown_pct}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>WIN RATE</div>
                  <div className="mono" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                    {comparedExp2.metrics?.win_rate_pct}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiment List Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Saved Backtest Records</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Select up to 2 experiments to compare side-by-side
          </span>
        </div>

        {experiments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No saved experiments found. Run a backtest in the Strategy Lab and click "Save Experiment"!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px' }}>COMPARE</th>
                <th style={{ padding: '10px' }}>EXPERIMENT NAME</th>
                <th style={{ padding: '10px' }}>ASSET</th>
                <th style={{ padding: '10px' }}>STRATEGY</th>
                <th style={{ padding: '10px' }}>RETURN</th>
                <th style={{ padding: '10px' }}>SHARPE</th>
                <th style={{ padding: '10px' }}>MAX DD</th>
                <th style={{ padding: '10px' }}>TRADES</th>
                <th style={{ padding: '10px' }}>CREATED</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((exp) => {
                const isEditing = editingId === exp.id;
                const isCompared = compareIds.includes(exp.id);
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(exp.id)}
                        style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                      />
                    </td>

                    <td style={{ padding: '10px', fontWeight: '600' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                            }}
                          />
                          <button
                            onClick={() => handleRename(exp.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', cursor: 'pointer' }}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{exp.name}</span>
                          <button
                            onClick={() => { setEditingId(exp.id); setEditName(exp.name); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            title="Rename"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{exp.asset}</span>
                    </td>

                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                      {exp.strategy_name}
                    </td>

                    <td className="mono" style={{
                      padding: '10px',
                      fontWeight: '700',
                      color: exp.metrics?.total_return_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {exp.metrics?.total_return_pct >= 0 ? `+${exp.metrics?.total_return_pct}%` : `${exp.metrics?.total_return_pct}%`}
                    </td>

                    <td className="mono" style={{ padding: '10px' }}>
                      {exp.metrics?.sharpe_ratio}
                    </td>

                    <td className="mono" style={{ padding: '10px', color: 'var(--accent-red)' }}>
                      -{exp.metrics?.max_drawdown_pct}%
                    </td>

                    <td className="mono" style={{ padding: '10px' }}>
                      {exp.trade_count || exp.metrics?.total_trades || 0}
                    </td>

                    <td style={{ padding: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {exp.created_at ? exp.created_at.split('T')[0] : 'Recent'}
                    </td>

                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (onRerun) onRerun(exp);
                            onNavigate('strategy-lab');
                          }}
                          className="btn-cyan"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          title="Rerun experiment in Strategy Lab"
                        >
                          <Play size={12} /> Rerun
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete experiment"
                        >
                          <Trash2 size={15} color="var(--accent-red)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

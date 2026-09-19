import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export default function MetricCard({ title, value, change, isPositive, subtitle, icon: Icon, badgeColor = 'cyan' }) {
  return (
    <div className="glass-panel glass-panel-hover" style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={16} color="var(--accent-cyan)" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
        <span className="mono" style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {value}
        </span>
        {change && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

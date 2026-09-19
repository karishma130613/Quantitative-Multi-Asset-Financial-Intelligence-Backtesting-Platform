import React from 'react';
import { 
  LayoutDashboard, LineChart, Network, FlaskConical, 
  Workflow, SearchCheck, CloudSun, ShieldAlert, 
  Bot, FolderClock, UserCheck, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function Sidebar({ currentPath, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'market-explorer', label: 'Market Explorer', icon: LineChart, badge: 'Live' },
    { id: 'correlation-lab', label: 'Correlation Lab', icon: Network, badge: '3D' },
    { id: 'strategy-lab', label: 'Strategy Lab', icon: FlaskConical, badge: 'Core' },
    { id: 'visual-builder', label: 'Visual Builder', icon: Workflow, badge: 'Logic' },
    { id: 'strategy-detective', label: 'Strategy Detective', icon: SearchCheck, badge: 'AI/ML' },
    { id: 'market-weather', label: 'Market Weather', icon: CloudSun, badge: 'Regime' },
    { id: 'stress-test', label: 'Stress Test', icon: ShieldAlert, badge: 'Risk' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'Quant' },
    { id: 'experiments', label: 'Experiments', icon: FolderClock, badge: null },
    { id: 'profile', label: 'Profile & Settings', icon: UserCheck, badge: null },
  ];

  const handleItemClick = (id) => {
    onNavigate(id);
    if (mobileOpen && onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
          }}
          className="mobile-backdrop"
        />
      )}

      <aside
        style={{
          width: collapsed ? '72px' : '240px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease',
          zIndex: 48,
          flexShrink: 0,
          minHeight: 'calc(100vh - 64px)',
        }}
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Navigation list */}
        <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            padding: '4px 12px 8px',
            display: collapsed ? 'none' : 'block',
          }}>
            Quant Terminal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: collapsed ? '10px' : '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: active 
                    ? 'linear-gradient(90deg, rgba(0, 240, 255, 0.15), rgba(121, 40, 202, 0.05))' 
                    : 'transparent',
                  color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: active ? '600' : '500',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderLeft: active ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                }}
                className="nav-item-btn"
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '2px 6px',
                        borderRadius: '9999px',
                        background: active ? 'rgba(0, 240, 255, 0.2)' : 'var(--bg-tertiary)',
                        color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontWeight: '600',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Collapse Button */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onToggleCollapse}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {!collapsed && <span>Collapse Sidebar</span>}
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}

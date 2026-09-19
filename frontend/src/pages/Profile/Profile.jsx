import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  User, Mail, Shield, Moon, Sun, 
  LogOut, Save, CheckCircle2, Cpu, Camera, AlertCircle
} from 'lucide-react';

export default function Profile({ onNavigate }) {
  const { user, updateProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || 'Alexander Vance, CFA');
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [avatarData, setAvatarData] = useState(null); // base64 data URL to save
  const [avatarError, setAvatarError] = useState('');
  const [avatarHover, setAvatarHover] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    if (!file.type.startsWith('image/')) {
      setAvatarError('Only image files (PNG, JPG, WebP) are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 256x256 maintaining aspect ratio
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatarPreview(compressedDataUrl);
        setAvatarData(compressedDataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedMsg('');
    try {
      const updatePayload = {
        full_name: fullName,
        theme_preference: isDark ? 'dark' : 'light',
      };
      // Include avatar if changed
      if (avatarData) {
        updatePayload.avatar_url = avatarData;
      }
      await updateProfile(updatePayload);
      setAvatarData(null); // reset pending avatar
      setSavedMsg('Profile settings updated successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = avatarPreview || user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'QuantLabAlpha'}`;

  return (
    <div style={{ padding: '24px', maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Clickable Avatar with Upload Overlay */}
          <div
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={handleAvatarClick}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            title="Click to change profile picture"
          >
            <img
              src={currentAvatar}
              alt="Profile Picture"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: `2px solid ${avatarHover ? 'var(--accent-amber)' : 'var(--accent-cyan)'}`,
                objectFit: 'cover',
                display: 'block',
                transition: 'border-color 0.2s ease, filter 0.2s ease',
                filter: avatarHover ? 'brightness(0.65)' : 'brightness(1)',
              }}
            />
            {/* Upload overlay icon */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: avatarHover ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
              }}
            >
              <Camera size={22} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.8))' }} />
            </div>
            {/* "CHANGE" label below icon when hovered */}
            {avatarHover && (
              <div style={{
                position: 'absolute',
                bottom: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.6rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                color: 'var(--accent-amber)',
                whiteSpace: 'nowrap',
                textShadow: '0 0 8px rgba(245,158,11,0.7)',
              }}>
                CHANGE
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          <div style={{ marginLeft: avatarHover ? '6px' : '0', transition: 'margin 0.2s' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800' }}>{user?.full_name || 'Quantitative Researcher'}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email || 'analyst@quantlab.internal'}</p>
            <span className="badge badge-cyan" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
              Institutional Alpha License
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary"
          style={{ borderColor: 'rgba(255, 51, 102, 0.3)', color: 'var(--accent-red)' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Avatar validation error */}
      {avatarError && (
        <div style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', padding: '10px 16px', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {avatarError}
        </div>
      )}

      {/* Pending avatar change notice */}
      {avatarData && !savedMsg && (
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 16px', borderRadius: '10px', color: 'var(--accent-amber)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={16} /> New profile picture selected — click "Save Changes" to apply.
        </div>
      )}

      {savedMsg && (
        <div style={{ background: 'rgba(0, 223, 143, 0.1)', border: '1px solid rgba(0, 223, 143, 0.3)', padding: '12px 16px', borderRadius: '10px', color: 'var(--accent-green)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {savedMsg}
        </div>
      )}

      {/* Account Settings Form */}
      <form onSubmit={handleSaveProfile} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          Research Profile &amp; Credentials
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            RESEARCHER DISPLAY NAME
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            REGISTERED INSTITUTIONAL EMAIL (IMMUTABLE)
          </label>
          <input
            type="email"
            disabled
            value={user?.email || 'demo@quantlab.io'}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'not-allowed',
            }}
          />
        </div>

        {/* Theme preference toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Visual Theme Preference</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently set to {isDark ? 'Cyber Obsidian (Dark)' : 'High-Contrast Ivory (Light)'}</div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            {isDark ? <Sun size={15} color="var(--accent-amber)" /> : <Moon size={15} color="var(--accent-cyan)" />}
            <span>Toggle Theme</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-cyan"
          style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '0.85rem', marginTop: '10px' }}
        >
          <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

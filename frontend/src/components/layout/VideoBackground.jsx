import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function VideoBackground() {
  const { isDark } = useTheme();
  const [videoError, setVideoError] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const videoSrc = isDark 
    ? '/16275217_3840_2160_25fps.mp4' 
    : '/12984442_1920_1080_100fps.mp4';

  useEffect(() => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  // Animated canvas fallback if video is not available or blocked
  useEffect(() => {
    if (!videoError) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes representing quantitative network
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoError]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
      backgroundColor: 'var(--bg-primary)',
    }}>
      {!videoError ? (
        <video
          key={videoSrc}
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%) scale(1.05)',
            opacity: isDark ? 0.60 : 0.42,
            filter: isDark 
              ? 'blur(5px) brightness(0.90) contrast(1.1) saturate(1.1)' 
              : 'blur(4px) brightness(1.04) contrast(1.06)',
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease',
          }}
          src={videoSrc}
        />
      ) : (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.35,
          }}
        />
      )}

      {/* Theme adaptive overlay gradient */}
      <div 
        className="video-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse at center, rgba(5, 11, 24, 0.12) 0%, rgba(5, 11, 24, 0.50) 100%)'
            : 'radial-gradient(ellipse at center, rgba(244, 246, 251, 0.20) 0%, rgba(244, 246, 251, 0.58) 100%)',
          transition: 'background 0.3s ease',
        }} 
      />
    </div>
  );
}

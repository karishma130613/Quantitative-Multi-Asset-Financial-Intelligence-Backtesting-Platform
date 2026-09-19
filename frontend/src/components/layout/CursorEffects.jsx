import React, { useEffect, useRef } from 'react';

export default function CursorEffects() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Respect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const colors = ['#00f0ff', '#38bdf8', '#00d2ff', '#60a5fa', '#2563eb', '#93c5fd'];
    let lastPos = { x: -200, y: -200 };
    let mousePos = { x: -200, y: -200 };
    let isMoving = false;
    let moveTimeout;

    const spawnParticles = (x, y, count = 3) => {
      for (let i = 0; i < count; i++) {
        // Limit max particles to keep 60+ FPS effortlessly
        if (particles.length > 75) particles.shift();

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.8 + 0.5;

        particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vx: Math.cos(angle) * speed * 0.6,
          vy: -Math.random() * 1.6 - 0.3, // float gracefully upwards
          size: Math.floor(Math.random() * 4) + 7, // 7px to 10px: tiny cute $ sparkles
          alpha: 1.0,
          decay: Math.random() * 0.024 + 0.018, // smooth fade
          rotation: (Math.random() - 0.5) * 0.5,
          rotSpeed: (Math.random() - 0.5) * 0.03,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const onMouseMove = (e) => {
      mousePos = { x: e.clientX, y: e.clientY };
      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => { isMoving = false; }, 100);

      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      const dist = Math.hypot(dx, dy);

      // Spawn tiny $ sparkles when cursor moves
      if (dist > 6) {
        const count = Math.min(Math.floor(dist / 10) + 2, 5);
        spawnParticles(e.clientX, e.clientY, count);
        lastPos = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render active tiny dollar particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Electric blue glow effect
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = p.color;
        ctx.font = `700 ${p.size}px 'JetBrains Mono', 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);

        ctx.restore();
      }

      // Draw small primary focal $ symbol at mouse pointer in electric blue
      if (mousePos.x > 0 && mousePos.y > 0 && isMoving) {
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00f0ff';
        ctx.font = "700 11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', mousePos.x, mousePos.y);

        // Subtle tiny outer pulse circle around cursor in blue
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(moveTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
}

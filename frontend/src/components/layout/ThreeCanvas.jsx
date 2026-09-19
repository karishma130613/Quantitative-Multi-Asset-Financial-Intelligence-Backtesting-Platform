import React, { useRef, useEffect } from 'react';

export default function ThreeCanvas({ assets = ['GLD', 'BTC', 'NVDA', 'SPY', 'ETH'] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = canvas.parentElement.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Sphere particle points
    const sphereRadius = Math.min(width, height) * 0.38;
    const numPoints = 85;
    const points = [];

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        x: sphereRadius * Math.cos(theta) * Math.sin(phi),
        y: sphereRadius * Math.sin(theta) * Math.sin(phi),
        z: sphereRadius * Math.cos(phi),
        asset: i < assets.length ? assets[i] : null,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 0.04;
      mouseY = ((e.clientY - rect.top) / height - 0.5) * 0.04;
    };
    canvas.addEventListener('mousemove', onMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotX += 0.004 + mouseY * 0.5;
      rotY += 0.007 + mouseX * 0.5;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const projected = points.map((p) => {
        // Rotate Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Perspective projection
        const fov = 350;
        const scale = fov / (fov + z2);
        return {
          x: width / 2 + x1 * scale,
          y: height / 2 + y2 * scale,
          scale,
          z: z2,
          asset: p.asset,
        };
      });

      // Sort by depth
      projected.sort((a, b) => a.z - b.z);

      // Connect near points with glowing cybernetic lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 42) {
            const alpha = (1 - dist / 42) * (projected[i].scale * 0.25);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      projected.forEach((p) => {
        const isAsset = !!p.asset;
        const radius = isAsset ? 6 * p.scale : 2.2 * p.scale;
        const alpha = Math.max(0.2, (p.z + sphereRadius) / (sphereRadius * 2));

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fillStyle = isAsset ? `rgba(0, 240, 255, ${alpha})` : `rgba(157, 78, 221, ${alpha * 0.7})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = isAsset ? 10 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isAsset && p.z > -sphereRadius * 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '600 10px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(p.asset, p.x, p.y - 9);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [assets]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

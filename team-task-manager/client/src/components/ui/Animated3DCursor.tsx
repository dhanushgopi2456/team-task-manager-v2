import React, { useEffect, useRef, useState } from 'react';

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'diamond' | 'shard' | 'cube' | 'circle';
}

const PALETTE = [
  '#6366f1', // Indigo
  '#818cf8', // Light Indigo
  '#06b6d4', // Cyan
  '#67e8f9', // Light Cyan
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#38bdf8', // Sky
];

export function Animated3DCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);

  // Position tracking with spring damping
  const mouseRef = useRef({
    x: -100,
    y: -100,
    prevX: -100,
    prevY: -100,
    smoothX: -100,
    smoothY: -100,
    vx: 0,
    vy: 0,
    tiltX: 0,
    tiltY: 0,
    angle: 0,
    speed: 0,
  });

  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for touch / reduced motion
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle3D[] = [];
    const trail: { x: number; y: number; age: number }[] = [];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const spawnParticles = (x: number, y: number, count = 2, speedMultiplier = 1) => {
      for (let i = 0; i < count; i++) {
        if (particles.length > 180) particles.shift(); // keep performance 60fps
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.8 + Math.random() * 2.8) * speedMultiplier;
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const shapes: Particle3D['shape'][] = ['diamond', 'shard', 'cube', 'circle'];

        particles.push({
          x,
          y,
          z: (Math.random() - 0.5) * 80,
          vx: Math.cos(angle) * speed + mouseRef.current.vx * 0.15,
          vy: Math.sin(angle) * speed + mouseRef.current.vy * 0.15,
          vz: (Math.random() - 0.5) * 3,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 0.15,
          vRotY: (Math.random() - 0.5) * 0.15,
          vRotZ: (Math.random() - 0.5) * 0.15,
          size: 4 + Math.random() * 6,
          color,
          alpha: 0.9,
          decay: 0.014 + Math.random() * 0.018,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!visible) setVisible(true);
      const m = mouseRef.current;
      m.x = e.clientX;
      m.y = e.clientY;

      // Check hover targets
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = !!target.closest(
          'a, button, input, textarea, select, [role="button"], .card3d-hover, [data-interactive]'
        );
        setHovered(isInteractive);
      }

      // Spawn motion graphics particles
      const dx = m.x - m.prevX;
      const dy = m.y - m.prevY;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        spawnParticles(m.x, m.y, Math.min(Math.floor(dist / 8) + 1, 4), Math.min(dist / 15, 2.5));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setClicking(true);
      // Spawn burst shockwave of 3D crystal shards
      spawnParticles(e.clientX, e.clientY, 18, 3.2);
    };

    const handleMouseUp = () => {
      setClicking(false);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // 60FPS Render Loop
    const fov = 300; // 3D camera focal depth

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const m = mouseRef.current;

      // Smooth cursor lerp
      const k = 0.22;
      m.smoothX += (m.x - m.smoothX) * k;
      m.smoothY += (m.y - m.smoothY) * k;

      m.vx = m.x - m.prevX;
      m.vy = m.y - m.prevY;
      m.speed = Math.hypot(m.vx, m.vy);
      m.prevX = m.x;
      m.prevY = m.y;

      // 3D tilt angles calculated from velocity
      m.tiltX += (Math.max(-45, Math.min(45, -m.vy * 1.8)) - m.tiltX) * 0.15;
      m.tiltY += (Math.max(-45, Math.min(45, m.vx * 1.8)) - m.tiltY) * 0.15;
      m.angle += 0.03 + Math.min(m.speed * 0.015, 0.1);

      // Record ribbon trail
      if (m.x > 0 && m.y > 0) {
        trail.unshift({ x: m.x, y: m.y, age: 1 });
        if (trail.length > 14) trail.pop();
      }

      // Draw 3D luminous ribbon trail
      if (trail.length > 2) {
        for (let i = 0; i < trail.length - 1; i++) {
          const pt = trail[i];
          const next = trail[i + 1];
          const ratio = 1 - i / trail.length;

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(next.x, next.y);
          ctx.lineWidth = ratio * 3.5;
          ctx.strokeStyle = `rgba(99, 102, 241, ${ratio * 0.4})`;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Core cyan neon line
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(next.x, next.y);
          ctx.lineWidth = ratio * 1.2;
          ctx.strokeStyle = `rgba(103, 232, 249, ${ratio * 0.6})`;
          ctx.stroke();
        }
      }

      // Update & render 3D geometric particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vz *= 0.96;
        p.rotX += p.vRotX;
        p.rotY += p.vRotY;
        p.rotZ += p.vRotZ;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // 3D Perspective Projection
        const scale = fov / (fov + p.z);
        const projX = p.x;
        const projY = p.y;
        const projSize = p.size * scale;

        ctx.save();
        ctx.translate(projX, projY);
        ctx.rotate(p.rotZ);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * scale;

        if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -projSize);
          ctx.lineTo(projSize * 0.6, 0);
          ctx.lineTo(0, projSize);
          ctx.lineTo(-projSize * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'shard') {
          ctx.beginPath();
          ctx.moveTo(0, -projSize * 1.4);
          ctx.lineTo(projSize * 0.4, projSize * 0.4);
          ctx.lineTo(-projSize * 0.4, projSize * 0.8);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'cube') {
          // Fake 3D isometric cube
          const s = projSize * 0.7;
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-s / 2, -s / 2, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, projSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Update HTML 3D Gyroscope Ring & Dot
      if (cursorDotRef.current && cursorRingRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;

        const ringSize = hovered ? 46 : clicking ? 26 : 34;
        const tiltStr = `perspective(500px) translate3d(${m.smoothX}px, ${m.smoothY}px, 0) rotateX(${m.tiltX}deg) rotateY(${m.tiltY}deg) rotateZ(${m.angle * (180 / Math.PI)}deg)`;

        cursorRingRef.current.style.transform = tiltStr;
        cursorRingRef.current.style.width = `${ringSize}px`;
        cursorRingRef.current.style.height = `${ringSize}px`;
        cursorRingRef.current.style.margin = `-${ringSize / 2}px 0 0 -${ringSize / 2}px`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [visible, hovered, clicking]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* 2D Canvas for 3D Shards & Luminous Stream Trail */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Inner precise dot */}
      <div
        ref={cursorDotRef}
        className="absolute top-0 left-0 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full pointer-events-none transition-colors duration-200"
        style={{
          background: hovered
            ? 'radial-gradient(circle, #67e8f9 0%, #06b6d4 100%)'
            : 'radial-gradient(circle, #ffffff 0%, #818cf8 100%)',
          boxShadow: hovered
            ? '0 0 14px 2px rgba(6,182,212,0.9), 0 0 4px #fff'
            : '0 0 10px 2px rgba(99,102,241,0.85), 0 0 3px #fff',
        }}
      />

      {/* Outer 3D Gyroscope Holographic Ring */}
      <div
        ref={cursorRingRef}
        className="absolute top-0 left-0 rounded-xl pointer-events-none transition-[width,height,margin,border-color,box-shadow] duration-200 ease-out flex items-center justify-center"
        style={{
          border: hovered
            ? '2px solid rgba(6, 182, 212, 0.9)'
            : '1.5px solid rgba(129, 140, 248, 0.75)',
          background: hovered
            ? 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(99,102,241,0.06) 100%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 80%)',
          boxShadow: hovered
            ? '0 0 20px 4px rgba(6,182,212,0.45), inset 0 0 10px rgba(103,232,249,0.3)'
            : '0 0 16px 2px rgba(99,102,241,0.35), inset 0 0 8px rgba(129,140,248,0.2)',
        }}
      >
        {/* Subtle crosshair notches inside 3D ring */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-0.5 w-1 h-1 rounded-full bg-cyan-300" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-0.5 w-1 h-1 rounded-full bg-indigo-400" />
      </div>
    </div>
  );
}

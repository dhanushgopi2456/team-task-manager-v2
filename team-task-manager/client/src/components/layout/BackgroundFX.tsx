import { useMemo } from 'react';

/**
 * TEAM TASK MANAGER ambient background — layered gradient atmosphere,
 * drifting light orbs, subtle grid and floating particles.
 * Pure CSS transforms only; respects prefers-reduced-motion via index.css.
 */
export function BackgroundFX() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: `${(i * 37 + 13) % 100}%`,
        top: `${(i * 53 + 29) % 100}%`,
        size: 2 + ((i * 7) % 4),
        delay: `${(i % 9) * 1.3}s`,
        duration: `${7 + (i % 6) * 2.5}s`,
        opacity: 0.25 + ((i % 5) * 0.12),
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Base atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 85% -10%, rgba(99,102,241,.16), transparent 60%), radial-gradient(1000px 700px at -10% 30%, rgba(139,92,246,.13), transparent 55%), radial-gradient(900px 900px at 50% 110%, rgba(6,182,212,.10), transparent 60%)',
        }}
      />
      <div className="grid-overlay" />

      {/* Drifting light orbs */}
      <div
        className="orb animate-drift"
        style={{ width: 420, height: 420, left: '-8%', top: '-12%', background: 'rgba(99,102,241,.20)' }}
      />
      <div
        className="orb animate-drift"
        style={{ width: 360, height: 360, right: '-6%', top: '22%', background: 'rgba(139,92,246,.16)', animationDelay: '-8s' }}
      />
      <div
        className="orb animate-drift"
        style={{ width: 300, height: 300, left: '30%', bottom: '-14%', background: 'rgba(6,182,212,.14)', animationDelay: '-16s' }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-indigo-300"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `floatY ${p.duration} ease-in-out ${p.delay} infinite`,
            boxShadow: '0 0 8px rgba(165,180,252,.8)',
          }}
        />
      ))}
    </div>
  );
}

/** Full-screen brand loading screen. */
export function BrandLoader({ label = 'Preparing your workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <svg width="72" height="72" viewBox="0 0 64 64" className="animate-float-y drop-shadow-[0_12px_28px_rgba(99,102,241,.5)]">
        <defs>
          <linearGradient id="ld-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="0.55" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="58" height="58" rx="16" fill="url(#ld-g)" />
        <rect x="7" y="7" width="50" height="50" rx="13" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M18 34.5 L27 43.5 L46 22.5" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-center">
        <p className="font-display text-xl font-extrabold tracking-wide brand-gradient-text">TEAM TASK MANAGER</p>
        <p className="mt-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {label}
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
        </p>
      </div>
    </div>
  );
}

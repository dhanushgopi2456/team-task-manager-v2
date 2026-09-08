import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ─── Brand logo mark ─────────────────────────────────────────────── */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Team Task Manager logo">
      <defs>
        <linearGradient id="ttm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill="url(#ttm-g)" />
      <rect x="7" y="7" width="50" height="50" rx="13" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M18 34.5 L27 43.5 L46 22.5" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="drop-shadow-[0_6px_16px_rgba(99,102,241,.45)] transition-transform duration-500 hover:rotate-6">
        <Logo size={compact ? 34 : 42} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-[15px] font-extrabold tracking-wide">TEAM TASK MANAGER</p>
          <p className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">Smart Teamwork · Clear Tasks</p>
        </div>
      )}
    </div>
  );
}

/* ─── Avatar ──────────────────────────────────────────────────────── */
const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({
  name,
  color,
  size = 36,
  ring = false,
}: {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ${
        ring ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-transparent' : ''
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${color}, ${shade(color)})`,
        boxShadow: `0 4px 12px -2px ${color}66, inset 0 1px 0 rgba(255,255,255,.35)`,
      }}
      title={name}
    >
      {initialsOf(name || '?')}
    </div>
  );
}

function shade(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 46);
  const g = Math.max(0, ((n >> 8) & 255) - 26);
  const b = Math.max(0, (n & 255) + 18);
  return `rgb(${r},${g},${b})`;
}

/* ─── Role / status badges ────────────────────────────────────────── */
const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-rose-500/15 text-rose-300 border border-rose-400/30',
  team_lead: 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/30',
  regular_member: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30',
};
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  team_lead: 'Team Lead',
  regular_member: 'Member',
};

export function RoleBadge({ role, memberType }: { role: string; memberType?: string | null }) {
  const key = role === 'admin' ? 'admin' : memberType || 'regular_member';
  return <span className={`chip ${ROLE_STYLES[key]}`}>{ROLE_LABELS[key]}</span>;
}

export const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-500/15 text-slate-300 border-slate-400/25',
  medium: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  high: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  urgent: 'bg-rose-500/15 text-rose-300 border-rose-400/35 animate-pulse-glow',
};

export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  todo: { label: 'To Do', cls: 'bg-slate-500/15 text-slate-300', dot: '#94a3b8' },
  in_progress: { label: 'In Progress', cls: 'bg-sky-500/15 text-sky-300', dot: '#38bdf8' },
  review: { label: 'Review', cls: 'bg-violet-500/15 text-violet-300', dot: '#a78bfa' },
  completed: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-300', dot: '#34d399' },
};

export function StatusChip({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.todo;
  return (
    <span className={`chip border border-white/10 ${m.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

/* ─── Progress bar ────────────────────────────────────────────────── */
export function ProgressBar({
  value,
  gradient = 'from-indigo-500 via-violet-500 to-fuchsia-400',
  height = 8,
  delay = 0,
}: {
  value: number;
  gradient?: string;
  height?: number;
  delay?: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-black/25 shadow-inner"
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        style={{ boxShadow: '0 0 12px rgba(129,140,248,.55)' }}
      />
    </div>
  );
}

/* ─── Page heading ────────────────────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-2xl font-extrabold tracking-tight md:text-3xl"
        >
          {title}
        </motion.h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

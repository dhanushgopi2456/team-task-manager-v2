import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import {
  FolderKanban, ListChecks, CheckCircle2, Clock3, AlertTriangle, Users,
  ArrowRight, Sun, Sunset, Moon,
} from 'lucide-react';
import { api } from '../api/client';
import type { DashboardData } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar, PageHeader } from '../components/ui/primitives';
import { SkeletonCard } from '../components/ui/feedback';
import { useAuth } from '../hooks/useAuth';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function GreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return <Sun size={22} className="text-amber-300" />;
  if (h < 17) return <Sunset size={22} className="text-orange-300" />;
  return <Moon size={22} className="text-indigo-300" />;
}

const ACTION_TEXT: Record<string, (m: any) => string> = {
  created_project: (m) => `created the project “${m?.name ?? ''}”`,
  updated_project: () => 'updated a project',
  archived_project: (m) => `archived “${m?.name ?? ''}”`,
  deleted_project: (m) => `deleted “${m?.name ?? ''}”`,
  created_task: (m) => `created task “${m?.title ?? m?.taskTitle ?? ''}”`,
  completed_task: (m) => `completed “${m?.title ?? ''}” ✅`,
  updated_task: () => 'updated a task',
  changed_status: (m) => `moved “${m?.title ?? ''}” → ${String(m?.to ?? '').replace('_', ' ')}`,
  assigned_task: (m) => `assigned “${m?.title ?? ''}”`,
  added_comment: (m) => `commented on “${m?.taskTitle ?? ''}”`,
  added_member: (m) => `added ${m?.member ?? 'a member'} to ${m?.projectName ?? 'a project'}`,
  removed_member: (m) => `removed a member from ${m?.projectName ?? 'a project'}`,
  joined: () => 'joined Team Task Manager',
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/reports/dashboard')).data.data ?? (await api.get('/reports/dashboard')).data,
  });

  const kpis = data?.kpis;
  const completionPct = kpis && kpis.totalTasks > 0 ? Math.round((kpis.completedTasks / kpis.totalTasks) * 100) : 0;
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-36 rounded-3xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card3d relative mb-7 overflow-hidden !p-7 md:!p-9"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
              <GreetingIcon /> {dateStr}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {greeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              You have <span className="font-bold text-indigo-300">{data.me.open}</span> open tasks
              {data.dueToday.length > 0 && (
                <> · <span className="font-bold text-amber-300">{data.dueToday.length}</span> due today</>
              )}
              . Let's make progress.
            </p>
          </div>

          {/* Productivity score dial */}
          <div className="flex items-center gap-4">
            <div className="relative h-[120px] w-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="74%" outerRadius="100%" data={[{ value: data.me.productivityScore }]} startAngle={90} endAngle={90 - 360}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={14} fill="url(#scoreGrad)" background={{ fill: 'rgba(255,255,255,.07)' }} />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-extrabold">{data.me.productivityScore}%</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Score</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Projects" value={kpis!.totalProjects} icon={<FolderKanban size={22} />} accent="#6366f1"
          footer={<ProgressBar value={Math.min(100, kpis!.totalProjects * 12)} gradient="from-indigo-500 to-violet-400" />} delay={0.05} />
        <StatCard label="Total Tasks" value={kpis!.totalTasks} icon={<ListChecks size={22} />} accent="#8b5cf6"
          footer={<ProgressBar value={completionPct} />} delay={0.1} />
        <StatCard label="Completed Tasks" value={kpis!.completedTasks} icon={<CheckCircle2 size={22} />} accent="#10b981"
          footer={<p className="text-xs font-semibold text-emerald-300">{completionPct}% of all work shipped</p>} delay={0.15} />
        <StatCard label="Pending Tasks" value={kpis!.pendingTasks} icon={<Clock3 size={22} />} accent="#f59e0b"
          footer={<p className="text-xs font-semibold text-amber-300">{data.statusBreakdown.in_progress + data.statusBreakdown.review} actively moving</p>} delay={0.2} />
        <StatCard label="Overdue Tasks" value={kpis!.overdueTasks} icon={<AlertTriangle size={22} />} accent="#ef4444"
          footer={<p className="text-xs font-semibold text-rose-300">{kpis!.overdueTasks > 0 ? 'Needs attention today' : 'All clear — great job!'}</p>} delay={0.25} />
        <StatCard label="Team Members" value={kpis!.teamMembers} icon={<Users size={22} />} accent="#06b6d4"
          footer={<Link to="/team" className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200">View team <ArrowRight size={12} /></Link>} delay={0.3} />
      </div>

      {/* Charts row */}
      <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card3d p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold">Weekly Productivity</h3>
              <p className="text-xs text-muted">Tasks completed over the last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.weeklyProductivity}>
              <defs>
                <linearGradient id="wkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,.12)" vertical={false} />
              <XAxis dataKey="label" stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,13,26,.92)', border: '1px solid rgba(129,140,248,.35)', borderRadius: 14, color: '#eef1ff', backdropFilter: 'blur(8px)' }}
                itemStyle={{ color: '#c7d2fe' }}
                cursor={{ stroke: 'rgba(129,140,248,.4)' }}
              />
              <Area type="monotone" dataKey="completed" stroke="#818cf8" strokeWidth={3} fill="url(#wkFill)" animationDuration={1100} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card3d p-5 lg:col-span-2">
          <h3 className="mb-1 font-display text-base font-bold">Due Today</h3>
          <p className="mb-4 text-xs text-muted">Deadlines landing before midnight</p>
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {data.dueToday.length === 0 && <p className="py-10 text-center text-sm text-muted">Nothing due today — enjoy the clear runway ☀️</p>}
            {data.dueToday.map((t) => (
              <button key={t._id} onClick={() => navigate(`/tasks/${t._id}`)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.03] px-3.5 py-2.5 text-left transition hover:border-indigo-400/30 hover:bg-white/[.07]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{t.title}</span>
                  <span className="block truncate text-[11px] text-muted">{(t.project as any)?.name}</span>
                </span>
                <span className="chip shrink-0 border border-white/10 bg-white/5 capitalize">{String(t.priority)}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity feed */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card3d p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Team Activity</h3>
          <Link to="/reports" className="text-xs font-bold text-indigo-300 hover:text-indigo-200">Full reports →</Link>
        </div>
        <ol className="relative ml-3 border-l border-white/10 pl-6">
          {data.recentActivity.map((a, i) => (
            <motion.li
              key={a._id}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="relative mb-5 last:mb-1"
            >
              <span
                className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-[#05070f]"
                style={{ background: `linear-gradient(135deg, ${a.actor?.avatarColor ?? '#6366f1'}, #8b5cf6)` }}
              >
                <span className="text-[8px] font-extrabold text-white">{a.actor?.name?.[0] ?? '?'}</span>
              </span>
              <p className="text-sm leading-snug">
                <span className="font-bold">{a.actor?.name}</span>{' '}
                <span className="text-muted">{ACTION_TEXT[a.action]?.(a.meta) ?? a.action.replace(/_/g, ' ')}</span>
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{timeAgo(a.createdAt)}</p>
            </motion.li>
          ))}
          {data.recentActivity.length === 0 && <li className="text-sm text-muted">No activity yet.</li>}
        </ol>
      </motion.div>
    </div>
  );
}

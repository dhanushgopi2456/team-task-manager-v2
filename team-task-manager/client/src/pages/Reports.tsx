import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import type { ReportsData } from '../types';
import { PageHeader, ProgressBar, Avatar } from '../components/ui/primitives';
import { SkeletonCard } from '../components/ui/feedback';
import { StatCard } from '../components/ui/StatCard';

const PIE_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#38bdf8',
  review: '#a78bfa',
  completed: '#34d399',
};

const tooltipStyle = {
  background: 'rgba(10,13,26,.92)',
  border: '1px solid rgba(129,140,248,.35)',
  borderRadius: 14,
  color: '#eef1ff',
};

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery<ReportsData>({
    queryKey: ['reports', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get(`/reports?${params}`);
      return res.data;
    },
  });

  if (isLoading || !data)
    return (
      <div className="space-y-6">
        <div className="skeleton h-24 rounded-3xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
        </div>
      </div>
    );

  const s = data.summary;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Completion rates, team productivity and workload distribution across your workspace."
        actions={
          <div className="card3d flex flex-wrap items-center gap-2 p-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input !w-auto !py-1.5 text-xs" aria-label="From date" />
            <span className="text-xs text-muted">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input !w-auto !py-1.5 text-xs" aria-label="To date" />
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Completion Rate" value={`${s.completionRate}%`} icon={<TrendingUp size={20} />} accent="#10b981" delay={0} footer={<ProgressBar value={s.completionRate} gradient="from-emerald-500 to-teal-400" height={6} />} />
        <StatCard label="Tasks Completed" value={s.completed} icon={<BarChart3 size={20} />} accent="#6366f1" delay={0.05} footer={<p className="text-xs text-muted">of {s.total} created in range</p>} />
        <StatCard label="In Progress" value={s.inProgress + s.review} icon={<PieIcon size={20} />} accent="#38bdf8" delay={0.1} footer={<p className="text-xs text-muted">{s.review} awaiting review</p>} />
        <StatCard label="Overdue Share" value={`${s.overduePct}%`} icon={<AlertTriangle size={20} />} accent="#ef4444" delay={0.15} footer={<p className="text-xs text-muted">{s.overdue} tasks past deadline</p>} />
      </div>

      {/* Charts */}
      <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="card3d p-5 lg:col-span-3">
          <h3 className="font-display text-base font-bold">Task Status Distribution</h3>
          <p className="mb-4 text-xs text-muted">Current snapshot of all work in your scope</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.statusDistribution} barSize={42}>
              <defs>
                {Object.entries(PIE_COLORS).map(([k, c]) => (
                  <linearGradient key={k} id={`bar-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,.12)" vertical={false} />
              <XAxis dataKey="name" stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(129,140,248,.08)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={900}>
                {data.statusDistribution.map((entry) => (
                  <Cell key={entry.key} fill={`url(#bar-${entry.key})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card3d p-5 lg:col-span-2">
          <h3 className="font-display text-base font-bold">Completion Trend</h3>
          <p className="mb-4 text-xs text-muted">Tasks completed over the selected period</p>
          {data.trend.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No completions recorded in this period yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.trend} barSize={30}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,.12)" vertical={false} />
                <XAxis dataKey="label" stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(129,140,248,.08)' }} />
                <Bar dataKey="completed" fill="url(#bar-completed)" radius={[8, 8, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Project completion */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card3d mb-7 p-5">
        <h3 className="mb-1 font-display text-base font-bold">Project Completion</h3>
        <p className="mb-5 text-xs text-muted">Progress of every project in your scope</p>
        <div className="space-y-4">
          {data.projects.map((p, i) => (
            <div key={String(p.id)}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                  {p.name}
                  {p.overdue > 0 && <span className="text-rose-300">· {p.overdue} overdue</span>}
                </span>
                <span className="text-muted">{p.completed}/{p.total}</span>
              </div>
              <ProgressBar
                value={p.progress}
                height={9}
                delay={i * 0.06}
                gradient={
                  p.progress >= 80 ? 'from-emerald-500 to-teal-400' : p.progress >= 40 ? 'from-indigo-500 to-violet-400' : 'from-amber-500 to-orange-400'
                }
              />
            </div>
          ))}
          {data.projects.length === 0 && <p className="text-sm text-muted">No projects yet.</p>}
        </div>
      </motion.div>

      {/* Member performance */}
      {data.members.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card3d overflow-x-auto p-5">
          <h3 className="mb-1 font-display text-base font-bold">Member Performance</h3>
          <p className="mb-5 text-xs text-muted">Workload distribution and delivery rate per teammate</p>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted">
                <th className="pb-3 pl-2">Member</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Completed</th>
                <th className="pb-3">Open</th>
                <th className="pb-3 pr-2">Delivery Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id} className="table-row border-b border-white/[.04] last:border-0">
                  <td className="py-3 pl-2">
                    <span className="flex items-center gap-2.5 font-semibold">
                      <Avatar name={m.name} color={m.avatarColor} size={28} /> {m.name}
                    </span>
                  </td>
                  <td className="py-3 font-bold">{m.total}</td>
                  <td className="py-3 font-bold text-emerald-300">{m.completed}</td>
                  <td className="py-3 font-bold text-sky-300">{m.open}</td>
                  <td className="w-[180px] py-3 pr-2">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={m.rate} height={6} gradient="from-indigo-500 to-cyan-400" />
                      <span className="shrink-0 text-xs font-bold">{m.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  ShieldCheck, Users, UserCheck, UserX, FolderKanban, ListChecks,
  ShieldAlert, LogIn, ArrowRight, Crown, UserCog, UserRound,
} from 'lucide-react';
import { api, apiError } from '../../api/client';
import type { AdminAnalytics } from '../../types';
import { PageHeader } from '../../components/ui/primitives';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState, SkeletonGrid } from '../../components/ui/feedback';

const tooltipStyle = {
  background: 'rgba(10,13,26,.92)',
  border: '1px solid rgba(129,140,248,.35)',
  borderRadius: 14,
  color: '#eef1ff',
};

export default function AdminDashboard() {
  const { data, isLoading, error }: any = useQuery<AdminAnalytics>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data;
    },
  });

  if (isLoading)
    return (
      <div>
        <div className="skeleton mb-6 h-24 rounded-3xl" />
        <SkeletonGrid count={6} />
      </div>
    );
  if (error || !data?.users)
    return <EmptyState title="Unable to load analytics" message={apiError(error)} />;

  const u = data.users;
  const p = data.platform;
  const activityTotal = data.systemActivity.reduce((a: number, b: any) => a + b.events, 0);
  const maxActivity = Math.max(1, ...data.systemActivity.map((d: any) => d.events));

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="System-wide overview of users, projects, tasks and security events."
        actions={
          <>
            <Link to="/admin/users" className="btn-primary"><UserCog size={15} /> Manage Users</Link>
          </>
        }
      />

      {/* Hero strip */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="card3d relative mb-7 overflow-hidden !p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-rose-500/25 via-violet-500/15 to-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 p-4 text-white shadow-[0_12px_30px_-6px_rgba(239,68,68,.5)]">
              <ShieldCheck size={34} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">System control center</p>
              <h2 className="font-display text-2xl font-extrabold md:text-3xl">Platform is healthy</h2>
              <p className="mt-1 text-sm text-muted">{activityTotal} audit events in the last 7 days · {u.recentLogins} active members this week</p>
            </div>
          </div>

          {/* Role distribution mini viz */}
          <div className="flex items-end gap-3">
            {[
              { label: 'Admins', value: u.admins, icon: Crown, color: '#f87171' },
              { label: 'Team Leads', value: u.teamLeads, icon: UserCog, color: '#818cf8' },
              { label: 'Members', value: u.regularMembers, icon: UserRound, color: '#34d399' },
            ].map((r) => (
              <div key={r.label} className="w-24 text-center">
                <div
                  className="mx-auto w-full rounded-t-xl transition-all duration-700"
                  style={{
                    height: `${Math.max(12, (r.value / Math.max(1, Math.max(u.teamLeads, u.regularMembers))) * 90)}px`,
                    background: `linear-gradient(180deg, ${r.color}, ${r.color}33)`,
                    boxShadow: `0 0 18px -4px ${r.color}`,
                  }}
                />
                <p className="mt-1.5 font-display text-lg font-extrabold">{r.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={u.totalUsers} icon={<Users size={22} />} accent="#6366f1"
          footer={<Link to="/admin/users" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-indigo-200">User management <ArrowRight size={11} /></Link>} delay={0.02} />
        <StatCard label="Active Users" value={u.activeUsers} icon={<UserCheck size={22} />} accent="#10b981"
          footer={<ProgressBarMini pct={Math.round((u.activeUsers / Math.max(1, u.totalUsers)) * 100)} gradient="from-emerald-500 to-teal-400" />} delay={0.06} />
        <StatCard label="Inactive Users" value={u.inactiveUsers} icon={<UserX size={22} />} accent="#f59e0b"
          footer={<p className="text-xs text-muted">Deactivated accounts retain history</p>} delay={0.1} />
        <StatCard label="Security Events" value={p.securityEvents} icon={<ShieldAlert size={22} />} accent="#ef4444"
          footer={<Link to="/admin/audit-logs" className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 hover:text-rose-200">Audit logs <ArrowRight size={11} /></Link>} delay={0.14} />
        <StatCard label="Total Projects" value={p.totalProjects} icon={<FolderKanban size={22} />} accent="#8b5cf6"
          footer={<p className="text-xs text-muted">{p.archivedProjects} archived</p>} delay={0.18} />
        <StatCard label="Total Tasks" value={p.totalTasks} icon={<ListChecks size={22} />} accent="#06b6d4" delay={0.22}
          footer={<Link to="/reports" className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200">Global reports <ArrowRight size={11} /></Link>} />
        <StatCard label="Logins (7d)" value={u.recentLogins} icon={<LogIn size={22} />} accent="#38bdf8" delay={0.26} />
        <StatCard label="Team Productivity" value={`${u.totalUsers ? Math.round((u.regularMembers + u.teamLeads) / u.totalUsers * 100) : 0}%`} icon={<UserRound size={22} />} accent="#a78bfa" delay={0.3} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="card3d p-5 lg:col-span-3">
          <h3 className="font-display text-base font-bold">System Activity</h3>
          <p className="mb-4 text-xs text-muted">Security-relevant events recorded per day</p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.systemActivity}>
              <defs>
                <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,.12)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#9aa3c7" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(129,140,248,.4)' }} />
              <Area type="monotone" dataKey="events" stroke="#f472b6" strokeWidth={3} fill="url(#sysFill)" animationDuration={1100} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent audit feed */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="card3d p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Recent Audit Events</h3>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-indigo-300 hover:text-indigo-200">View all →</Link>
          </div>
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {(data.recentAudit ?? []).map((log: any) => (
              <div key={log._id} className="flex items-start justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.03] px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{log.action.replace(/_/g, ' ')}</p>
                  <p className="truncate text-[11px] text-muted">{log.actorName}{log.targetLabel ? ` → ${log.targetLabel}` : ''}</p>
                </div>
                <span className={`chip shrink-0 border ${log.result === 'failure' ? 'border-rose-400/30 bg-rose-500/15 text-rose-300' : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'}`}>
                  {log.result}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ProgressBarMini({ pct, gradient }: { pct: number; gradient: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        style={{ width: `${pct}%`, boxShadow: '0 0 8px rgba(52,211,153,.6)', transition: 'width .8s cubic-bezier(.22,1,.36,1)' }}
      />
    </div>
  );
}

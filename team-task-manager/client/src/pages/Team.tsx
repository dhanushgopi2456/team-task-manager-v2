import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import { api } from '../api/client';
import { PageHeader, Avatar, RoleBadge, ProgressBar, PRIORITY_STYLES } from '../components/ui/primitives';
import { EmptyState, SkeletonGrid } from '../components/ui/feedback';

export default function Team() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['directory'],
    queryFn: async () => (await api.get('/users/directory/all')).data,
  });

  const members = (data?.members ?? []).filter((m: any) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (roleFilter === 'admin' && m.role !== 'admin') return false;
    if (roleFilter === 'team_lead' && m.memberType !== 'team_lead') return false;
    if (roleFilter === 'regular_member' && !(m.role === 'member' && m.memberType === 'regular_member')) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Everyone building together — workload, delivery record and current projects."
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card3d mb-7 flex flex-wrap items-center gap-3 p-4">
        <span className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teammates…" className="input pl-9" />
        </span>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-auto cursor-pointer">
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="team_lead">Team Leads</option>
          <option value="regular_member">Regular Members</option>
        </select>
      </motion.div>

      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : members.length === 0 ? (
        <EmptyState icon={<Users size={34} />} title="No teammates found" message="Try a different search or role filter." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m: any, i: number) => (
            <MemberCard key={String(m.id)} m={m} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ m, index }: { m: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.35), duration: 0.5 }}
      className="card3d card3d-hover relative overflow-hidden p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl" style={{ background: m.avatarColor }} />
      <div className="relative flex items-center gap-4">
        <Avatar name={m.name} color={m.avatarColor} size={52} ring />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-base font-bold">{m.name}</p>
          <p className="truncate text-xs text-muted">{m.jobTitle || m.email}</p>
          <div className="mt-1.5"><RoleBadge role={m.role} memberType={m.memberType} /></div>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Open', value: m.workload },
          { label: 'Done', value: m.completed },
          { label: 'Projects', value: m.projectCount },
        ].map((x) => (
          <div key={x.label} className="rounded-xl border border-white/[.06] bg-white/[.03] py-2.5">
            <p className="font-display text-lg font-extrabold">{x.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{x.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
          <span className="uppercase tracking-widest text-muted">Productivity</span>
          <span style={{ color: m.avatarColor }}>{m.productivity}%</span>
        </div>
        <ProgressBar
          value={m.productivity}
          height={6}
          gradient={
            m.productivity >= 70 ? 'from-emerald-500 to-teal-400' : m.productivity >= 40 ? 'from-indigo-500 to-violet-400' : 'from-amber-500 to-orange-400'
          }
        />
      </div>

      {m.projects?.length > 0 && (
        <div className="relative mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/[.07] pt-3.5">
          {m.projects.map((p: any) => (
            <span key={String(p.id)} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.05] px-2.5 py-0.5 text-[10px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
              {p.name.length > 18 ? `${p.name.slice(0, 18)}…` : p.name}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

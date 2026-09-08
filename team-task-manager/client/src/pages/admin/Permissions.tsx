import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, UserCog, UserRound, ShieldCheck, Eye, Settings2, Ban } from 'lucide-react';
import { api, apiError } from '../../api/client';
import { PageHeader } from '../../components/ui/primitives';
import { EmptyState, SkeletonGrid } from '../../components/ui/feedback';

const LEVEL_META = [
  { label: 'No Access', icon: Ban, cls: 'text-slate-500' },
  { label: 'View', icon: Eye, cls: 'text-sky-300' },
  { label: 'Manage', icon: Settings2, cls: 'text-violet-300' },
  { label: 'Full Control', icon: ShieldCheck, cls: 'text-emerald-300' },
];

const ROLE_ICONS = [Crown, UserCog, UserRound];
const ROLE_GRADIENTS = [
  'from-rose-500/25 to-red-500/5 text-rose-300',
  'from-indigo-500/25 to-violet-500/5 text-indigo-300',
  'from-emerald-500/25 to-teal-500/5 text-emerald-300',
];

export default function Permissions() {
  const { data, isLoading, error }: any = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/admin/permissions')).data,
  });

  if (isLoading) return <div className="space-y-6"><div className="skeleton h-24 rounded-3xl" /><SkeletonGrid count={3} /></div>;
  if (error || !data?.matrix) return <EmptyState title="Unable to load permissions" message={apiError(error)} />;

  const matrix = data.matrix;
  const levels: string[] = data.levels;

  return (
    <div>
      <PageHeader
        title="Permission Management"
        subtitle="Role-Based Access Control matrix — what each credential level can do across Team Task Manager."
      />

      {/* Level legend */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card3d mb-7 flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted">Access levels:</span>
        {levels.map((l, i) => {
          const meta = LEVEL_META[i] ?? LEVEL_META[0];
          return (
            <span key={l} className="flex items-center gap-1.5 text-xs font-bold">
              <meta.icon size={14} className={meta.cls} /> {l}
              <span className="ml-1 rounded-full bg-white/[.07] px-1.5 py-0.5 text-[9px] font-extrabold">L{i}</span>
            </span>
          );
        })}
      </motion.div>

      {/* Role cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {matrix.map((role: any, idx: number) => {
          const Icon = ROLE_ICONS[idx] ?? UserRound;
          const gradient = ROLE_GRADIENTS[idx] ?? ROLE_GRADIENTS[1];
          return (
            <motion.div
              key={role.role}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="card3d card3d-hover overflow-hidden"
            >
              <div className={`flex items-center gap-4 border-b border-white/10 bg-gradient-to-br p-6 ${gradient}`}>
                <span className="rounded-2xl bg-black/30 p-3 shadow-glass"><Icon size={26} /></span>
                <div>
                  <p className="font-display text-lg font-extrabold tracking-wide">{role.role}</p>
                  <p className="text-xs font-semibold opacity-80">{role.summary}</p>
                </div>
              </div>

              <div className="p-5">
                <p className="mb-4 text-xs leading-relaxed text-muted">{role.description}</p>
                <ul className="space-y-2">
                  {role.categories.map((c: any) => {
                    const meta = LEVEL_META[c.level] ?? LEVEL_META[0];
                    return (
                      <li key={c.name} className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.03] px-3.5 py-2.5">
                        <span className="text-sm font-bold">{c.name}</span>
                        <span className={`chip border border-white/10 ${meta.cls} bg-white/[.05]`}>
                          <meta.icon size={11} />
                          {meta.label}
                          <span className="ml-0.5 rounded bg-white/10 px-1 text-[9px] font-extrabold">L{c.level}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* RBAC enforcement note */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card3d mt-7 p-5 text-sm leading-relaxed text-muted">
        <span className="font-bold text-white">Enforced at every layer:</span> the backend verifies each request's JWT,
        reloads the user from the database and checks permissions before any operation — role information from the client is never trusted.
        The frontend mirrors these rules to hide unauthorized actions, but direct API calls are equally protected.
      </motion.p>
    </div>
  );
}

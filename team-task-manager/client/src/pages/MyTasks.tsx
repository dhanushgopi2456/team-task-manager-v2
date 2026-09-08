import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ListChecks, CalendarClock, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { api } from '../api/client';
import type { Task, TaskStatus } from '../types';
import { PageHeader } from '../components/ui/primitives';
import { EmptyState } from '../components/ui/feedback';
import { TaskRow } from '../components/TaskRow';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const SECTIONS = [
  { key: 'overdue', label: 'Overdue Tasks', icon: AlertTriangle },
  { key: 'today', label: "Today's Tasks", icon: CalendarClock },
  { key: 'upcoming', label: 'Upcoming Tasks', icon: ListChecks },
  { key: 'completed', label: 'Completed Tasks', icon: CheckCircle2 },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export default function MyTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => (await api.get('/tasks?mine=true&limit=100')).data,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-lite'],
    queryFn: async () => (await api.get('/projects')).data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.patch(`/tasks/${id}`, { status }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast(vars.status === 'completed' ? 'Task completed 🎉' : 'Task reopened');
    },
    onError: (e: any) => toast(e?.response?.data?.message || 'Could not update task', 'error'),
  });

  const tasks: Task[] = data?.tasks ?? [];
  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (priority !== 'all' && t.priority !== priority) return false;
        if (projectFilter !== 'all' && String((t.project as any)?._id) !== projectFilter) return false;
        return true;
      }),
    [tasks, search, priority, projectFilter]
  );

  const sections = useMemo(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const result: Record<SectionKey, Task[]> = { today: [], upcoming: [], overdue: [], completed: [] };
    for (const t of filtered) {
      if (t.status === 'completed') {
        result.completed.push(t);
        continue;
      }
      if (!t.dueDate) {
        result.upcoming.push(t);
        continue;
      }
      const d = new Date(t.dueDate);
      if (d < startOfToday) result.overdue.push(t);
      else if (d <= endOfToday) result.today.push(t);
      else result.upcoming.push(t);
    }
    for (const key of Object.keys(result) as SectionKey[]) {
      result[key].sort((a, b) => String(a.dueDate ?? '9').localeCompare(String(b.dueDate ?? '9')));
    }
    return result;
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle={`Your personal workspace — ${tasks.filter((t) => t.status !== 'completed').length} open tasks assigned to you.`}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card3d mb-7 flex flex-wrap items-center gap-3 p-4"
      >
        <span className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="input pl-9" />
        </span>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input w-auto cursor-pointer capitalize">
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="input w-auto max-w-[200px] cursor-pointer">
          <option value="all">All projects</option>
          {(projectsData?.projects ?? []).map((p: any) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={34} />}
          title="No tasks match your filters"
          message={
            user?.role === 'member' && user.memberType === 'regular_member'
              ? 'When teammates assign you work it will appear here.'
              : 'Try clearing the search or filters above.'
          }
        />
      ) : (
        <div className="space-y-5">
          {SECTIONS.map((s) => {
            const list = sections[s.key];
            if (list.length === 0) return null;
            const isCollapsed = collapsed[s.key];
            return (
              <motion.section key={s.key} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card3d overflow-hidden p-4">
                <button onClick={() => setCollapsed((c) => ({ ...c, [s.key]: !c[s.key] }))} className="mb-3 flex w-full items-center gap-2.5 text-left">
                  <s.icon size={17} className={s.key === 'overdue' ? 'text-rose-300' : s.key === 'today' ? 'text-amber-300' : s.key === 'completed' ? 'text-emerald-300' : 'text-indigo-300'} />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider">{s.label}</h2>
                  <span className="chip border border-white/10 bg-white/5">{list.length}</span>
                  <ChevronDown size={16} className={`ml-auto text-muted transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-2">
                    {list.map((t) => (
                      <TaskRow key={t._id} task={t} onStatus={(task, st) => statusMutation.mutate({ id: task._id, status: st })} />
                    ))}
                  </div>
                )}
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}

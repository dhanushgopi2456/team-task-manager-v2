import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import type { Task } from '../types';
import { PageHeader, Avatar } from '../components/ui/primitives';

type View = 'month' | 'week' | 'day';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: async () => (await api.get('/tasks?limit=100')).data,
  });

  const tasks: Task[] = useMemo(() => data?.tasks ?? [], [data]);

  const tasksOn = (d: Date) => {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= day && new Date(t.dueDate) < next
    );
  };

  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  ).length;

  function shift(dir: number) {
    if (view === 'month') setCursor((c) => new Date(c.getFullYear(), c.getMonth() + dir, 1));
    else if (view === 'week')
      setCursor((c) => {
        const x = startOfWeek(c);
        x.setDate(x.getDate() + dir * 7);
        return x;
      });
    else
      setCursor((c) => {
        const x = new Date(c);
        x.setDate(x.getDate() + dir);
        return x;
      });
  }

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const weekCells = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [cursor]);

  const headerLabel =
    view === 'month'
      ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${startOfWeek(cursor).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${new Date(
            startOfWeek(cursor).getTime() + 6 * 86400000
          ).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const focusTasks = view === 'day' ? tasksOn(cursor) : tasksOn(selected);

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={
          overdueCount > 0
            ? `You have ${overdueCount} overdue deadline${overdueCount > 1 ? 's' : ''}. Click any day to inspect its tasks.`
            : 'Task deadlines and project milestones at a glance.'
        }
        actions={
          <div className="card3d flex gap-1 p-1">
            {(['day', 'week', 'month'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  view === v ? 'raised text-white' : 'text-muted hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="card3d overflow-hidden !p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">{headerLabel}</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={() => shift(-1)} className="rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-white" aria-label="Previous">
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => {
                setCursor(new Date());
                setSelected(new Date());
              }}
              className="btn-ghost !px-3 !py-1.5 text-xs"
            >
              Today
            </button>
            <button onClick={() => shift(1)} className="rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-white" aria-label="Next">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6"><div className="skeleton h-[420px] rounded-2xl" /></div>
        ) : (
          <>
            {view === 'month' && (
              <div className="grid grid-cols-7">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="border-b border-white/[.06] px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted">
                    {w}
                  </div>
                ))}
                {monthCells.map((d, i) => {
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = d.toDateString() === new Date().toDateString();
                  const list = tasksOn(d);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelected(d);
                        setView('day');
                        setCursor(d);
                      }}
                      className={`min-h-[92px] border-b border-r border-white/[.05] p-1.5 text-left transition hover:bg-indigo-500/[.08] ${
                        !inMonth ? 'opacity-35' : ''
                      } ${isToday ? 'bg-indigo-500/[.10]' : ''}`}
                    >
                      <span className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'raised' : 'text-muted'}`}>
                        {d.getDate()}
                      </span>
                      <span className="block space-y-1">
                        {list.slice(0, 2).map((t) => (
                          <span key={t._id} className="block truncate rounded-md bg-white/[.08] px-1.5 py-0.5 text-[10px] font-semibold">
                            {t.title}
                          </span>
                        ))}
                        {list.length > 2 && (
                          <span className="block px-1 text-[10px] font-bold text-indigo-300">+{list.length - 2} more</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'week' && (
              <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-7">
                {weekCells.map((d) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const list = tasksOn(d);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => {
                        setSelected(d);
                        setView('day');
                        setCursor(d);
                      }}
                      className={`card3d card3d-hover min-h-[150px] !rounded-2xl p-3 text-left ${isToday ? 'ring-2 ring-indigo-400/60' : ''}`}
                    >
                      <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
                        {WEEKDAYS[d.getDay()]} {d.getDate()}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {tasksOn(d).slice(0, 3).map((t) => (
                          <span key={t._id} className="block truncate rounded-lg bg-white/[.08] px-2 py-1 text-[10px] font-semibold">
                            {t.title}
                          </span>
                        ))}
                        {tasksOn(d).length === 0 && <span className="block text-[10px] text-slate-600">—</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'day' && (
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display font-bold">{cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  <span className="chip border border-white/10 bg-white/5">{focusTasks.length} task{focusTasks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {focusTasks.length === 0 && <p className="py-8 text-center text-sm text-muted">No deadlines on this day.</p>}
                  {focusTasks.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => navigate(`/tasks/${t._id}`)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.03] px-4 py-3 text-left transition hover:border-indigo-400/40 hover:bg-white/[.07]"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background:
                            t.priority === 'urgent' ? '#f87171' : t.priority === 'high' ? '#fbbf24' : t.priority === 'medium' ? '#38bdf8' : '#94a3b8',
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{t.title}</span>
                        <span className="block truncate text-[11px] text-muted">{(t.project as any)?.name}</span>
                      </span>
                      <Avatar name={t.assignee?.name ?? '?'} color={t.assignee?.avatarColor ?? '#6366f1'} size={26} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, CalendarDays, Users2, ListTodo, CheckCircle2, Clock3,
  AlertTriangle, UserPlus, X, Paperclip, LayoutDashboard,
} from 'lucide-react';
import { api, apiError } from '../api/client';
import type { Project } from '../types';
import { ProgressBar, Avatar, RoleBadge, PRIORITY_STYLES } from '../components/ui/primitives';
import { EmptyState, Modal, ConfirmDialog, SkeletonCard } from '../components/ui/feedback';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskFormModal } from '../components/TaskFormModal';
import { TaskRow } from '../components/TaskRow';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const TABS = ['Overview', 'Tasks', 'Kanban', 'Team', 'Activity', 'Files', 'Timeline'] as const;
type Tab = (typeof TABS)[number];

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { user, isTeamLead, isAdmin } = useAuth();

  const [tab, setTab] = useState<Tab>('Overview');
  const [taskModal, setTaskModal] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<any>(null);

  const { data, isLoading, error }: any = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data,
  });

  const project: Project | undefined = data?.project;

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'project', id],
    queryFn: async () => (await api.get(`/tasks?project=${id}&limit=100`)).data,
    enabled: !!id,
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => (await api.get(`/activity?projectId=${id}`)).data,
    enabled: !!id && (tab === 'Activity' || tab === 'Overview'),
  });

  const { data: dirData } = useQuery({
    queryKey: ['directory'],
    queryFn: async () => (await api.get('/users/directory/all')).data,
    enabled: !!id && addMemberOpen,
  });

  const canManage =
    isAdmin ||
    (isTeamLead &&
      !!user &&
      project?.members?.some((m: any) => String(m.user?._id ?? m.user) === String(user.id)));

  const statusMutation = useMutation({
    mutationFn: ({ tid, status }: { tid: string; status: string }) => api.patch(`/tasks/${tid}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'project', id] });
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast('Task updated');
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const deleteTask = useMutation({
    mutationFn: async (tid: string) => (await api.delete(`/tasks/${tid}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'project', id] });
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast('Task deleted successfully');
      setConfirmDeleteTask(null);
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const addMember = useMutation({
    mutationFn: async (userId: string) => (await api.post(`/projects/${id}/members`, { userId })).data,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast(res.message || 'Member added');
      setAddMemberOpen(false);
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => (await api.delete(`/projects/${id}/members/${userId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast('Member removed');
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const tasks = tasksData?.tasks ?? [];
  const attachments = useMemo(
    () =>
      tasks.flatMap((t: any) =>
        (t.attachments ?? []).map((a: any) => ({ ...a, taskTitle: t.title, taskId: t._id }))
      ),
    [tasks]
  );

  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="skeleton h-40 rounded-3xl" />
        <SkeletonCard lines={5} />
      </div>
    );
  if (error || !project)
    return (
      <EmptyState
        title="Project unavailable"
        message="This project may have been deleted or you do not have access to it."
        action={
          <Link to="/projects" className="btn-primary">
            Back to Projects
          </Link>
        }
      />
    );

  const s = project.stats!;
  const memberIds = new Set((project.members ?? []).map((m: any) => String(m.user?._id ?? m.user)));
  const candidates = (dirData?.members ?? []).filter((m: any) => !memberIds.has(String(m.id)));
  const deadlineDays = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-white">
        <ArrowLeft size={15} /> All projects
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="card3d relative mb-6 overflow-hidden !p-7">
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}44)` }} />
        <div className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: project.color }} />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">{project.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{project.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold">
              <span className={`chip border capitalize ${PRIORITY_STYLES[project.priority]}`}>{project.priority} priority</span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <CalendarDays size={13} />
                {deadlineDays === null
                  ? 'No deadline'
                  : deadlineDays >= 0
                    ? `${deadlineDays} days remaining`
                    : `${Math.abs(deadlineDays)} days overdue`}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted"><Users2 size={13} />{project.members.length} members</span>
              <span className="capitalize text-muted">Status: <span className="font-bold text-indigo-300">{project.status.replace('_', ' ')}</span></span>
            </div>
          </div>
          {canManage && (
            <Link to={`/projects/${id}/board`} className="btn-primary">
              <LayoutDashboard size={15} /> Full Board
            </Link>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="card3d mb-6 flex flex-wrap gap-1 overflow-x-auto p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition ${
              tab === t ? 'raised text-white' : 'text-muted hover:bg-white/[.05] hover:text-white'
            }`}
          >
            {t}
            {t === 'Tasks' && tasks.length > 0 && <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{tasks.length}</span>}
            {t === 'Files' && attachments.length > 0 && <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{attachments.length}</span>}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-4">
            {[
              { label: 'Total', value: s.total, icon: ListTodo, color: '#818cf8' },
              { label: 'Completed', value: s.completed, icon: CheckCircle2, color: '#34d399' },
              { label: 'In Progress', value: s.in_progress + s.review, icon: Clock3, color: '#38bdf8' },
              { label: 'Overdue', value: s.overdue, icon: AlertTriangle, color: '#f87171' },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card3d card3d-hover p-4 text-center">
                <k.icon size={18} style={{ color: k.color }} className="mx-auto" />
                <p className="mt-2 font-display text-2xl font-extrabold">{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{k.label}</p>
              </motion.div>
            ))}
            <div className="card3d col-span-2 p-4 lg:col-span-4">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="uppercase tracking-widest text-muted">Project progress</span>
                <span className="font-display text-lg">{s.progress}%</span>
              </div>
              <ProgressBar value={s.progress} height={12} gradient="from-indigo-500 via-violet-500 to-cyan-400" />
            </div>

            <div className="card3d col-span-2 p-5 lg:col-span-4">
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-muted">Recent Activity</h3>
              <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                {(activityData?.activities ?? []).slice(0, 6).map((a: any) => (
                  <div key={a._id} className="flex items-start gap-3 text-sm">
                    <Avatar name={a.actor?.name ?? '?'} color={a.actor?.avatarColor ?? '#6366f1'} size={26} />
                    <p className="leading-snug">
                      <span className="font-bold">{a.actor?.name}</span>{' '}
                      <span className="text-muted">{a.action.replace(/_/g, ' ')}{a.meta?.title ? ` "${a.meta.title}"` : ''}</span>
                    </p>
                  </div>
                ))}
                {(activityData?.activities ?? []).length === 0 && <p className="text-sm text-muted">No activity in this project yet.</p>}
              </div>
            </div>
          </div>

          {/* Team panel */}
          <div className="card3d h-fit p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">Team</h3>
              {canManage && (
                <button onClick={() => setAddMemberOpen(true)} className="rounded-lg p-1.5 text-indigo-300 transition hover:bg-indigo-500/20" title="Add member">
                  <UserPlus size={16} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {project.members.map((m: any) => (
                <div key={String(m.user?._id ?? m.user)} className="group flex items-center gap-3">
                  <Avatar name={m.user?.name ?? '?'} color={m.user?.avatarColor ?? '#6366f1'} size={34} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-bold">{m.user?.name}</p>
                    <p className="truncate text-[11px] text-muted">{m.projectRole === 'lead' ? 'Project Lead' : 'Member'}</p>
                  </div>
                  {canManage && String(m.user?._id ?? m.user) !== String(project.owner?._id ?? project.owner) && (
                    <button onClick={() => removeMember.mutate(String(m.user._id))} className="rounded-lg p-1 text-slate-500 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100" title="Remove">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="space-y-2">
          <div className="mb-4 flex justify-end">
            {canManage && (
              <button onClick={() => setTaskModal(true)} className="btn-primary"><Plus size={15} /> New Task</button>
            )}
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              message="Create the first task to get this project moving."
              action={canManage ? <button onClick={() => setTaskModal(true)} className="btn-primary"><Plus size={15} /> Create Task</button> : undefined}
            />
          ) : (
            tasks.map((t: any) => (
              <div key={t._id} className="group relative">
                <TaskRow task={t} onStatus={(task, st) => statusMutation.mutate({ tid: task._id, status: st })} />
                {canManage && (
                  <button onClick={() => setConfirmDeleteTask(t)} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-lg bg-black/50 p-1.5 text-rose-300 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-rose-500/30" title="Delete task">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'Kanban' && (
        <>
          {canManage && (
            <div className="mb-4 flex justify-end">
              <button onClick={() => setTaskModal(true)} className="btn-primary"><Plus size={15} /> New Task</button>
            </div>
          )}
          <KanbanBoard tasks={tasks} projectId={id} canEdit={!!canManage || !!user} onAddTask={() => setTaskModal(true)} />
        </>
      )}

      {tab === 'Team' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {project.members.map((m: any, i: number) => (
            <motion.div key={String(m.user?._id)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card3d card3d-hover flex items-center gap-4 p-5">
              <Avatar name={m.user?.name} color={m.user?.avatarColor} size={48} ring />
              <div className="min-w-0">
                <p className="truncate font-display font-bold">{m.user?.name}</p>
                <p className="truncate text-xs text-muted">{m.user?.jobTitle}</p>
                <div className="mt-1.5"><RoleBadge role={(m.user as any)?.role ?? 'member'} memberType={(m.user as any)?.memberType} /></div>
              </div>
              {canManage && String(m.user?._id) !== String(project.owner?._id ?? project.owner) && (
                <button onClick={() => removeMember.mutate(String(m.user._id))} className="ml-auto rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/20 hover:text-rose-300"><X size={15} /></button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'Activity' && (
        <ol className="card3d relative ml-3 border-l border-white/10 p-6 pl-8">
          {(activityData?.activities ?? []).length === 0 && <p className="text-sm text-muted">No activity recorded yet.</p>}
          {(activityData?.activities ?? []).map((a: any, i: number) => (
            <motion.li key={a._id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative mb-5 last:mb-0">
              <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-[#0e1226]" style={{ background: `linear-gradient(135deg, ${a.actor?.avatarColor ?? '#6366f1'}, #8b5cf6)` }}>
                <span className="text-[8px] font-extrabold text-white">{a.actor?.name?.[0]}</span>
              </span>
              <p className="text-sm">
                <span className="font-bold">{a.actor?.name}</span>{' '}
                <span className="text-muted">
                  {a.action.replace(/_/g, ' ')}
                  {a.meta?.title ? ` "${a.meta.title}"` : a.meta?.taskTitle ? ` "${a.meta.taskTitle}"` : ''}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
            </motion.li>
          ))}
        </ol>
      )}

      {tab === 'Files' && (
        <div className="space-y-2">
          {attachments.length === 0 ? (
            <EmptyState
              icon={<Paperclip size={30} />}
              title="No files attached yet"
              message="Attachments added to project tasks will show up here."
            />
          ) : (
            attachments.map((a: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card3d card3d-hover flex items-center justify-between p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-xl bg-indigo-500/15 p-2.5 text-indigo-300"><Paperclip size={17} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{a.filename}</p>
                    <p className="truncate text-xs text-muted">on "{a.taskTitle}" · {(a.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/tasks/${a.taskId}`)} className="btn-ghost !px-3 !py-1.5 text-xs">Open task</button>
              </motion.div>
            ))
          )}
        </div>
      )}

      {tab === 'Timeline' && (
        <div className="card3d p-6">
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Started', value: project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
              { label: 'Deadline', value: project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
              { label: 'Progress', value: `${s.progress}%` },
            ].map((x) => (
              <div key={x.label} className="rounded-2xl border border-white/[.07] bg-white/[.03] p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{x.label}</p>
                <p className="mt-1 font-display text-lg font-extrabold">{x.value}</p>
              </div>
            ))}
          </div>

          {/* Simple gantt-style timeline of tasks */}
          <div className="space-y-2.5">
            {[...tasks]
              .sort((a: any, b: any) => String(a.dueDate ?? '9').localeCompare(String(b.dueDate ?? '9')))
              .map((t: any, i: number) => {
                const done = t.status === 'completed';
                return (
                  <motion.button
                    key={t._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/tasks/${t._id}`)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] px-4 py-2.5 text-left transition hover:border-indigo-400/30 hover:bg-white/[.07]"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${done ? 'bg-emerald-400' : t.status === 'in_progress' ? 'bg-sky-400' : t.status === 'review' ? 'bg-violet-400' : 'bg-slate-500'}`}
                      style={{ boxShadow: `0 0 8px ${done ? '#34d399' : t.status === 'in_progress' ? '#38bdf8' : 'transparent'}` }}
                    />
                    <span className={`flex-1 truncate text-sm font-semibold ${done ? 'text-muted line-through' : ''}`}>{t.title}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'no date'}
                    </span>
                    <span className={`chip shrink-0 border ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                  </motion.button>
                );
              })}
            {tasks.length === 0 && <p className="py-6 text-center text-sm text-muted">Add tasks to see the project timeline.</p>}
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskFormModal open={taskModal} onClose={() => setTaskModal(false)} projectId={id} />

      <Modal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add team member" width="max-w-md">
        <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
          {candidates.length === 0 && <p className="py-6 text-center text-sm text-muted">Everyone is already on this project.</p>}
          {candidates.map((m: any) => (
            <button
              key={String(m.id)}
              onClick={() => addMember.mutate(String(m.id))}
              disabled={addMember.isPending}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-3 text-left transition hover:border-indigo-400/40 hover:bg-white/[.08]"
            >
              <Avatar name={m.name} color={m.avatarColor} size={36} />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-bold">{m.name}</span>
                <span className="block truncate text-xs text-muted">{m.jobTitle || m.email}</span>
              </span>
              <RoleBadge role={m.role} memberType={m.memberType} />
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteTask}
        onClose={() => setConfirmDeleteTask(null)}
        onConfirm={() => deleteTask.mutate(confirmDeleteTask._id)}
        busy={deleteTask.isPending}
        title="Delete this task?"
        message={`"${confirmDeleteTask?.title}" and its comments will be permanently removed.`}
      />
    </div>
  );
}

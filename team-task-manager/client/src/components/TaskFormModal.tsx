import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Wand2 } from 'lucide-react';
import { api, apiError } from '../api/client';
import type { Project, Task, User } from '../types';
import { Modal } from './ui/feedback';
import { useToast } from '../hooks/useToast';

const AI_TASK_TEMPLATES = [
  {
    chip: '🔐 Auth & OAuth API',
    title: 'Architect JWT Authentication & OAuth2 Session Security',
    description: 'Implement secure authentication service using bcrypt password hashing, rotating JWT session tokens in httpOnly SameSite cookies, and rate-limited brute-force guards.\n\nAcceptance Criteria:\n- Endpoints: /auth/login, /auth/register, /auth/refresh\n- Token revocation audit logging\n- Unit & integration tests > 90% coverage',
    status: 'in_progress',
    priority: 'urgent',
    daysAhead: 5,
    tags: 'auth, security, backend, api',
  },
  {
    chip: '📋 Kanban Board DnD',
    title: 'Build Interactive Kanban Drag-and-Drop Workflow Board',
    description: 'Create responsive visual task board with smooth collision detection, optimistic UI updates, column lane statistics, and persistent drag ordering via REST API.\n\nAcceptance Criteria:\n- Accessible keyboard reordering\n- Sound juice & spring physics\n- Cross-browser touch drag support',
    status: 'todo',
    priority: 'high',
    daysAhead: 7,
    tags: 'kanban, ui, frontend, dnd',
  },
  {
    chip: '⚡ Redis Cache & Indexes',
    title: 'Optimize Database Query Indexes & Write-Through Redis Cache',
    description: 'Analyze slow query logs, create compound B-tree indexes on project/task collections, and introduce write-through Redis cache layer for dashboard KPI queries.\n\nAcceptance Criteria:\n- P99 response time reduced below 50ms\n- Index usage verification in Mongo explain plans',
    status: 'todo',
    priority: 'high',
    daysAhead: 4,
    tags: 'database, performance, backend, redis',
  },
  {
    chip: '🔔 Realtime Activity Feed',
    title: 'Design Real-Time Activity Feed & Push Notifications',
    description: 'Implement event-driven notification dispatch pipeline for task assignments, status changes, mentions, and project milestones.\n\nAcceptance Criteria:\n- Unread counter badge with instant live sync\n- Mark all read action with toast feedback',
    status: 'todo',
    priority: 'medium',
    daysAhead: 6,
    tags: 'notifications, realtime, ui',
  },
  {
    chip: '🚀 CI/CD & E2E Suite',
    title: 'Automated CI/CD Deployment Pipeline & Playwright E2E Suite',
    description: 'Configure GitHub Actions workflow for automated linting, TypeScript validation, container build, and staging deployment with preview URLs.\n\nAcceptance Criteria:\n- Zero-downtime deployment script\n- Slack build status webhook integration',
    status: 'todo',
    priority: 'medium',
    daysAhead: 8,
    tags: 'devops, cicd, testing, docker',
  },
  {
    chip: '📱 Mobile Touch Polish',
    title: 'Mobile Touch Navigation & High-Contrast Glassmorphism Polish',
    description: 'Refine responsive mobile viewport styling: bottom drawer menu, swipe gestures, touch-friendly 44px tap targets, and high-contrast ambient glass cards.\n\nAcceptance Criteria:\n- 100% Google Lighthouse mobile accessibility score\n- Zero horizontal scroll clipping',
    status: 'in_progress',
    priority: 'high',
    daysAhead: 3,
    tags: 'mobile, ux, css, responsive',
  },
];

export function TaskFormModal({
  open,
  onClose,
  projectId,
  project,
  task,
  initialStatus,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  project?: Project;
  task?: Task | null;
  initialStatus?: string;
  onSaved?: (t: any) => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [chosenProject, setChosenProject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const applyTemplate = (tmpl: (typeof AI_TASK_TEMPLATES)[number]) => {
    setIsGenerating(true);
    setTimeout(() => {
      setTitle(tmpl.title);
      setDescription(tmpl.description);
      setStatus(tmpl.status as any);
      setPriority(tmpl.priority as any);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + tmpl.daysAhead);
      setDueDate(targetDate.toISOString().slice(0, 10));
      setTags(tmpl.tags);
      setIsGenerating(false);
      toast(`✨ Auto-filled with AI recommendation: "${tmpl.title}"`);
    }, 220);
  };

  const handleRandomAIFill = () => {
    const randomTmpl = AI_TASK_TEMPLATES[Math.floor(Math.random() * AI_TASK_TEMPLATES.length)];
    applyTemplate(randomTmpl);
  };

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setStatus(task?.status ?? (initialStatus as any) ?? 'todo');
    setPriority(task?.priority ?? 'medium');
    setAssignee((task?.assignee as any)?._id ?? '');
    setDueDate(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
    setTags((task?.tags ?? []).join(', '));
  }, [open, task, initialStatus]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-lite'],
    queryFn: async () => (await api.get('/projects')).data,
    enabled: open && !projectId && !task,
  });

  const selectedProjectId = projectId || (task ? String((task.project as any)?._id ?? '') : chosenProject);

  const { data: detail } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: async () => (await api.get(`/projects/${selectedProjectId}`)).data,
    enabled: !!selectedProjectId,
  });

  const members: User[] =
    (detail?.project?.members ?? [])
      .map((m: any) => ({ id: m.user?._id ?? m.user, name: m.user?.name ?? '?', avatarColor: m.user?.avatarColor ?? '#6366f1', email: '', role: m.user?.role, memberType: m.user?.memberType, jobTitle: '' }))
      .filter(Boolean) ?? [];

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        description,
        status,
        priority,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6),
        assignee: assignee || '',
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : '',
      };
      if (task) return (await api.patch(`/tasks/${task._id}`, payload)).data;
      return (await api.post('/tasks', { ...payload, project: selectedProjectId })).data;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['project'] });
      toast(res.message || (task ? 'Task updated successfully' : 'Task created successfully'));
      onSaved?.(res.task);
      onClose();
    },
    onError: (e: any) => toast(apiError(e, 'Could not save task'), 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'Create New Task'} width="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        {/* AI Auto-Fill Recommendation Panel */}
        {!task && (
          <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 p-3.5 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                <span>AI Recommendation Engine</span>
              </span>
              <button
                type="button"
                onClick={handleRandomAIFill}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-600/30 px-2.5 py-1 text-[11px] font-bold text-indigo-200 transition-all hover:bg-indigo-600/50 hover:text-white"
              >
                <Wand2 size={12} className={isGenerating ? 'animate-spin' : ''} />
                <span>{isGenerating ? 'Generating…' : '✨ Auto-Fill with AI'}</span>
              </button>
            </div>
            <p className="mb-2 text-[11px] text-slate-300">
              Select an AI smart template or click Auto-Fill to populate recommended specifications:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AI_TASK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.title}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-all hover:border-indigo-400/60 hover:bg-indigo-500/20 hover:text-white active:scale-95"
                >
                  {tmpl.chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {!projectId && !task && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Project *</span>
            <select required value={chosenProject} onChange={(e) => setChosenProject(e.target.value)} className="input cursor-pointer">
              <option value="">Choose a project…</option>
              {(projectsData?.projects ?? []).map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Task title *</span>
          <input required minLength={2} maxLength={160} className="input" placeholder="e.g. Build authentication API" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Description</span>
          <textarea rows={3} maxLength={4000} className="input resize-none" placeholder="What needs to be done?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Status</span>
            <select className="input cursor-pointer capitalize" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Priority</span>
            <select className="input cursor-pointer capitalize" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Assignee</span>
            <select className="input cursor-pointer" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Due date</span>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tags (comma separated)</span>
          <input className="input" placeholder="api, urgent, backend" value={tags} onChange={(e) => setTags(e.target.value)} />
        </label>

        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

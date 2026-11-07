import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, CalendarDays, Users2, CheckCircle2, Archive, Pencil, Trash2, Search, Sparkles, Wand2 } from 'lucide-react';
import { api, apiError } from '../api/client';
import type { Project } from '../types';
import { PageHeader, ProgressBar, Avatar, PRIORITY_STYLES } from '../components/ui/primitives';
import { EmptyState, Modal, ConfirmDialog, SkeletonGrid } from '../components/ui/feedback';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-sky-500/15 text-sky-300 border-sky-400/25',
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  on_hold: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  completed: 'bg-violet-500/15 text-violet-300 border-violet-400/25',
  archived: 'bg-slate-500/15 text-slate-400 border-slate-400/20',
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const AI_PROJECT_TEMPLATES = [
  {
    chip: '🛒 E-Commerce Platform',
    name: 'FreshMart AI E-Commerce Platform',
    description: 'Next-gen omnichannel grocery platform featuring real-time inventory tracking, AI personalized recommendations, multi-vendor cart checkout, and sub-second catalog search.',
    status: 'active',
    priority: 'high',
    daysAhead: 30,
    color: '#6366f1',
  },
  {
    chip: '📱 Fintech Mobile App',
    name: 'FinPulse Wealth & Banking App v2',
    description: 'Ultra-secure biometric fintech mobile app with biometric FaceID sign-in, instant SEPA/ACH wire transfers, automated savings vaults, and interactive portfolio analytics.',
    status: 'active',
    priority: 'urgent',
    daysAhead: 45,
    color: '#06b6d4',
  },
  {
    chip: '⚡ Cloud Microservices',
    name: 'Cloud Infrastructure & Kubernetes Mesh',
    description: 'Zero-downtime multi-region cloud migration: Istio service mesh, auto-scaling microservices, Terraform IaC, distributed tracing, and automated canary deployments.',
    status: 'planning',
    priority: 'high',
    daysAhead: 60,
    color: '#f59e0b',
  },
  {
    chip: '🎨 Design System',
    name: 'Enterprise Design System & UI Kit',
    description: 'Unified cross-platform design token architecture, WCAG 2.1 AAA accessible UI components, interactive Figma Code Connect synchronization, and zero-runtime CSS theme engine.',
    status: 'active',
    priority: 'medium',
    daysAhead: 21,
    color: '#ec4899',
  },
  {
    chip: '🔒 Security Compliance',
    name: 'SOC2 Type II Security & Compliance Hardening',
    description: 'End-to-end security posture hardening: automated role-based access control, immutable audit trails, credential rotation policies, and continuous penetration testing verification.',
    status: 'active',
    priority: 'urgent',
    daysAhead: 14,
    color: '#10b981',
  },
  {
    chip: '🤖 AI Automation Engine',
    name: 'Autonomous Agent Workflow Orchestrator',
    description: 'Multi-agent event-driven automation framework with vector knowledge retrieval, real-time Slack/Teams webhook notifications, and human-in-the-loop task approval gates.',
    status: 'planning',
    priority: 'high',
    daysAhead: 28,
    color: '#8b5cf6',
  },
];

export function ProjectFormModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState(COLORS[0]);
  const [deadline, setDeadline] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const applyTemplate = (tmpl: (typeof AI_PROJECT_TEMPLATES)[number]) => {
    setIsGenerating(true);
    setTimeout(() => {
      setName(tmpl.name);
      setDescription(tmpl.description);
      setStatus(tmpl.status as any);
      setPriority(tmpl.priority as any);
      setColor(tmpl.color);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + tmpl.daysAhead);
      setDeadline(targetDate.toISOString().slice(0, 10));
      setIsGenerating(false);
      toast(`✨ Auto-filled with AI recommendation: "${tmpl.name}"`);
    }, 220);
  };

  const handleRandomAIFill = () => {
    const randomTmpl = AI_PROJECT_TEMPLATES[Math.floor(Math.random() * AI_PROJECT_TEMPLATES.length)];
    applyTemplate(randomTmpl);
  };

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setStatus((project?.status as any) ?? 'active');
    setPriority((project?.priority as any) ?? 'medium');
    setColor(project?.color ?? COLORS[0]);
    setDeadline(project?.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : '');
  }, [open, project]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name,
        description,
        status,
        priority,
        color,
        deadline: deadline ? new Date(deadline + 'T12:00:00').toISOString() : '',
      };
      if (project) return (await api.patch(`/projects/${project._id}`, payload)).data;
      return (await api.post('/projects', payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast(project ? 'Project updated successfully' : 'Project created successfully');
      onClose();
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit Project' : 'Create New Project'} width="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        {/* AI Auto-Fill Recommendation Panel */}
        {!project && (
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
              {AI_PROJECT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
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

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Project name *</span>
          <input required minLength={2} className="input" placeholder="e.g. FreshMart E-Commerce" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Description</span>
          <textarea rows={3} className="input resize-none" placeholder="What is this project about?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Status</span>
            <select className="input cursor-pointer capitalize" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Priority</span>
            <select className="input cursor-pointer capitalize" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Deadline</span>
            <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Color</span>
            <div className="flex gap-2 pt-1.5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`} style={{ background: c }} aria-label={`Color ${c}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function daysRemaining(deadline?: string) {
  if (!deadline) return null;
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return d;
}

function ProjectCard({ project, index, isAdmin, onEdit, onDelete }: { project: any; index: number; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const s = project.stats;
  const remaining = daysRemaining(project.deadline);
  const overdueBy = remaining !== null && remaining < 0 && project.status !== 'completed';

  return (
    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.5 }} className="card3d card3d-hover group relative overflow-hidden !p-0">
      {/* Color spine */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}66)` }} />
      <Link to={`/projects/${project._id}`} className="block p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold transition group-hover:text-indigo-200">{project.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-[2.1em] text-xs leading-relaxed text-muted">{project.description || 'No description yet.'}</p>
          </div>
          <span className={`chip shrink-0 border capitalize ${STATUS_STYLES[project.status]}`}>{project.status.replace('_', ' ')}</span>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-muted">{s?.progress ?? 0}% complete</span>
            <span className={overdueBy ? 'text-rose-300' : remaining !== null && project.status !== 'completed' ? 'text-amber-300' : 'text-emerald-300'}>
              {project.status === 'completed'
                ? 'Shipped 🎉'
                : remaining === null
                  ? 'No deadline'
                  : overdueBy
                    ? `${Math.abs(remaining!)} days overdue`
                    : `${remaining} days remaining`}
            </span>
          </div>
          <ProgressBar value={s?.progress ?? 0} gradient="from-indigo-500 via-violet-500 to-cyan-400" />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[.07] pt-3.5">
          <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" />{s?.completed ?? 0}/{s?.total ?? 0}</span>
            {(s?.overdue ?? 0) > 0 && <span className="text-rose-300">{s.overdue} overdue</span>}
            <span className={`chip border ${PRIORITY_STYLES[project.priority]}`}>{project.priority}</span>
          </div>
          <div className="flex -space-x-2">
            {(project.members ?? []).slice(0, 4).map((m: any, i: number) => (
              <Avatar key={i} name={m.user?.name ?? '?'} color={m.user?.avatarColor ?? '#6366f1'} size={24} />
            ))}
            {(project.members?.length ?? 0) > 4 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold">+{project.members.length - 4}</span>
            )}
          </div>
        </div>
      </Link>

      {isAdmin && (
        <div className="absolute right-3 top-5 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-lg bg-black/40 p-1.5 text-indigo-300 backdrop-blur transition hover:bg-indigo-500/30 hover:text-white" title="Edit project"><Pencil size={14} /></button>
          <button onClick={onDelete} className="rounded-lg bg-black/40 p-1.5 text-rose-300 backdrop-blur transition hover:bg-rose-500/30 hover:text-white" title="Delete project"><Trash2 size={14} /></button>
        </div>
      )}
    </motion.div>
  );
}

export default function Projects() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: async () => (await api.get(`/projects?includeArchived=${isAdmin}&status=${statusFilter}&search=${encodeURIComponent(search)}`)).data,
  });

  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/projects/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast('Project deleted successfully');
      setDeleting(null);
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const projects: Project[] = data?.projects ?? [];
  const canCreate = isAdmin;

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Every initiative your team is driving — progress at a glance."
        actions={
          canCreate && (
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus size={16} /> New Project
            </button>
          )
        }
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card3d mb-7 flex flex-wrap items-center gap-3 p-4">
        <span className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className="input pl-9" />
        </span>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto cursor-pointer">
          <option value="all">All statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
        </select>
      </motion.div>

      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={34} />}
          title="No projects yet"
          message={
            canCreate
              ? 'Create your first project to start organizing your team\'s work.'
              : user?.role === 'member'
                ? 'You will see projects here once an administrator adds you to a team.'
                : 'Adjust your filters or check back soon.'
          }
          action={
            canCreate && (
              <button onClick={() => setCreateOpen(true)} className="btn-primary">
                <Plus size={16} /> Create your first project
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p: any, i: number) => (
            <ProjectCard
              key={p._id}
              project={p}
              index={i}
              isAdmin={isAdmin}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <ProjectFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ProjectFormModal open={!!editing} onClose={() => setEditing(null)} project={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => del.mutate(deleting!._id)}
        busy={del.isPending}
        title="Delete this project?"
        message={`“${deleting?.name}” and all of its tasks will be permanently removed. This cannot be undone.`}
      />
    </div>
  );
}

/* ProjectFormModal above handles both create (no project prop) and edit. */


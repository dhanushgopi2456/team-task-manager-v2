import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, CalendarDays, User, Tag } from 'lucide-react';
import { api, apiError } from '../api/client';
import type { CommentItem, Task } from '../types';
import { Avatar, RoleBadge, StatusChip, PRIORITY_STYLES, STATUS_META } from '../components/ui/primitives';
import { EmptyState, SkeletonCard, Spinner } from '../components/ui/feedback';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [comment, setComment] = useState('');

  const { data, isLoading, error }: any = useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await api.get(`/tasks/${id}`)).data,
  });

  const task: Task | undefined = data?.task;
  const comments: CommentItem[] = data?.comments ?? [];
  const perms = data?.permissions;

  const statusMutation = useMutation({
    mutationFn: async (status: string) => (await api.patch(`/tasks/${id}`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast('Task status updated');
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: async () => (await api.post(`/tasks/${id}/comments`, { body: comment })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      setComment('');
      toast('Comment added');
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-3xl" />
        <SkeletonCard lines={4} />
      </div>
    );
  if (error || !task)
    return (
      <EmptyState
        title="Task unavailable"
        message="This task may have been deleted or you do not have access to it."
        action={<button onClick={() => navigate(-1)} className="btn-primary">Go back</button>}
      />
    );

  const canChangeStatus = perms?.canEdit || perms?.isAssignee;
  const overdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-white">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="card3d mb-6 !p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold md:text-2xl">{task.title}</h1>
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">{task.description || 'No description provided.'}</p>
          </div>
          <span className={`chip shrink-0 border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[.07] pt-4 text-xs sm:grid-cols-4">
          <div>
            <p className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted"><Tag size={11} /> Project</p>
            {(task.project as any)?._id ? (
              <Link to={`/projects/${(task.project as any)._id}`} className="font-semibold text-indigo-300 hover:text-indigo-200">
                {(task.project as any).name}
              </Link>
            ) : (
              <span className="font-semibold">{(task.project as any)?.name}</span>
            )}
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted"><CalendarDays size={11} /> Due date</p>
            <span className={`font-semibold ${overdue ? 'text-rose-300' : ''}`}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
            </span>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted"><User size={11} /> Assignee</p>
            {task.assignee ? (
              <span className="flex items-center gap-1.5 font-semibold">
                <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={20} /> {task.assignee.name}
              </span>
            ) : (
              <span className="font-semibold text-muted">Unassigned</span>
            )}
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted"><Tag size={11} /> Tags</p>
            <span className="flex flex-wrap gap-1">
              {task.tags.length === 0 && <span className="text-muted">None</span>}
              {task.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/[.07] px-2 py-0.5 text-[10px] font-bold">#{t}</span>
              ))}
            </span>
          </div>
        </div>

        {/* Status changer */}
        {canChangeStatus && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/[.07] pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Move to:</span>
            {Object.entries(STATUS_META)
              .filter(([key]) => key !== task.status)
              .map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => statusMutation.mutate(key)}
                  disabled={statusMutation.isPending}
                  className={`chip cursor-pointer border border-white/10 ${meta.cls} transition hover:scale-105 hover:shadow-glow`}
                >
                  {meta.label}
                </button>
              ))}
            {statusMutation.isPending && <Spinner size={14} />}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Comments */}
        <div className="card3d p-6 lg:col-span-2">
          <h2 className="mb-5 font-display text-base font-bold">Discussion <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">{comments.length}</span></h2>

          <div className="mb-5 space-y-4">
            {comments.length === 0 && <p className="text-sm text-muted">No comments yet — start the conversation.</p>}
            {comments.map((c) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar name={c.author?.name ?? '?'} color={c.author?.avatarColor ?? '#6366f1'} size={34} />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/[.07] bg-white/[.04] px-4 py-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{c.author?.name}</span>
                    <RoleBadge role={c.author?.role} memberType={c.author?.memberType} />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{c.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (comment.trim()) commentMutation.mutate();
            }}
            className="flex items-end gap-3"
          >
            {user && <Avatar name={user.name} color={user.avatarColor} size={34} />}
            <div className="relative flex-1">
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment… use @name to mention teammates"
                className="input resize-none pr-12"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!comment.trim() || commentMutation.isPending}
                className="btn-primary absolute bottom-2 right-2 !rounded-lg !p-2"
                aria-label="Send comment"
              >
                {commentMutation.isPending ? <Spinner size={15} /> : <Send size={15} />}
              </button>
            </div>
          </form>
        </div>

        {/* Side panel */}
        <div className="space-y-5">
          <div className="card3d p-5">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Status</dt>
                <dd><StatusChip status={task.status} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Created by</dt>
                <dd className="font-semibold">{(task.createdBy as any)?.name ?? 'Unknown'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Created</dt>
                <dd className="font-semibold">{new Date(task.createdAt).toLocaleDateString()}</dd>
              </div>
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Completed</dt>
                  <dd className="font-semibold text-emerald-300">{new Date(task.completedAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card3d p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted">
              <Paperclip size={13} /> Attachments ({task.attachments.length})
            </h3>
            {task.attachments.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted">No attachments on this task.</p>
            ) : (
              <ul className="space-y-2">
                {task.attachments.map((a: any, i: number) => (
                  <li key={i} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.03] px-3 py-2 text-xs">
                    <span className="truncate font-semibold">{a.filename}</span>
                    <span className="shrink-0 text-muted">{(a.size / 1024).toFixed(0)} KB</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card3d p-5">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">Your access</h3>
            <p className="text-xs leading-relaxed text-muted">
              {perms?.canEdit
                ? 'You can edit all details of this task.'
                : perms?.isAssignee
                  ? 'You are the assignee — you can update this task\'s status.'
                  : 'You have view access and can join the discussion.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, Paperclip } from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { Avatar, StatusChip, PRIORITY_STYLES } from './ui/primitives';

export function TaskRow({
  task,
  onStatus,
}: {
  task: Task;
  onStatus: (t: Task, s: TaskStatus) => void;
}) {
  const navigate = useNavigate();
  const done = task.status === 'completed';
  const overdue = !done && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/tasks/${task._id}`)}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] px-3.5 py-3 text-left transition hover:border-indigo-400/30 hover:bg-white/[.07] hover:shadow-glow"
    >
      <span
        role="checkbox"
        aria-checked={done}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onStatus(task, done ? 'in_progress' : 'completed');
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.stopPropagation();
            onStatus(task, done ? 'in_progress' : 'completed');
          }
        }}
        className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border transition ${
          done ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-slate-400/50 hover:border-emerald-400'
        }`}
      >
        {done && <CheckCircle2 size={13} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${done ? 'text-muted line-through' : ''}`}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          {(task.project as any)?.name && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: (task.project as any)?.color }} />
              {(task.project as any)?.name}
            </span>
          )}
          {task.dueDate && (
            <span className={overdue ? 'font-bold text-rose-300' : ''}>
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {(task.commentCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={11} />
              {task.commentCount}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={11} />
              {task.attachments.length}
            </span>
          )}
          {task.tags?.map((t) => (
            <span key={t} className="rounded-full bg-white/[.06] px-2 py-px text-[10px] font-medium">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <span className={`chip shrink-0 border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
      <span className="hidden sm:block">
        <StatusChip status={task.status} />
      </span>
      {task.assignee && <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={26} />}
    </motion.button>
  );
}

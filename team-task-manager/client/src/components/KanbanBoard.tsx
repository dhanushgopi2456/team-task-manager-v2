import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCorners, type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, MessageSquare, Paperclip, CalendarDays, Plus } from 'lucide-react';
import { api, apiError } from '../api/client';
import type { Task, TaskStatus } from '../types';
import { Avatar, PRIORITY_STYLES, STATUS_META } from './ui/primitives';
import { useToast } from '../hooks/useToast';

const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: 'todo', label: 'TO DO', accent: '#94a3b8' },
  { key: 'in_progress', label: 'IN PROGRESS', accent: '#38bdf8' },
  { key: 'review', label: 'REVIEW', accent: '#a78bfa' },
  { key: 'completed', label: 'COMPLETED', accent: '#34d399' },
];

function KanbanCard({
  task,
  dragging = false,
  onClick,
}: {
  task: Task;
  dragging?: boolean;
  onClick?: () => void;
}) {
  const overdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={dragging ? undefined : { y: -4 }}
      className={`card3d group cursor-pointer !rounded-2xl p-3.5 ${dragging ? 'rotate-2 scale-[1.03] shadow-card-hover ring-2 ring-indigo-400/60' : ''}`}
      style={{ willChange: 'transform' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[13px] font-bold leading-snug">{task.title}</p>
        <span className={`chip shrink-0 border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
      </div>

      {task.tags?.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-white/[.07] px-2 py-0.5 text-[10px] font-semibold text-muted">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[11px] font-semibold text-muted">
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 ${overdue ? 'font-bold text-rose-300' : ''}`}>
              <CalendarDays size={11} />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {(task.commentCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1"><MessageSquare size={11} />{task.commentCount}</span>
          )}
          {(task.attachments?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1"><Paperclip size={11} />{task.attachments.length}</span>
          )}
        </div>
        {task.assignee ? (
          <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={24} />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-500 text-[9px] text-slate-500">?</span>
        )}
      </div>
    </motion.div>
  );
}

function SortableCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef as any}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1, touchAction: 'none' }}
      className="relative"
    >
      <GripVertical
        size={13}
        className="absolute -left-1 top-1/2 z-10 -translate-y-1/2 cursor-grab text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      />
      <KanbanCard task={task} onClick={onOpen} />
    </div>
  );
}

export function KanbanBoard({
  tasks,
  projectId,
  canEdit,
  onAddTask,
}: {
  tasks: Task[];
  projectId?: string;
  canEdit: boolean;
  onAddTask?: (status: TaskStatus) => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);

  // Reset optimistic copy whenever fresh server data arrives and no drag is active
  useEffect(() => {
    if (!activeId) setLocalTasks(null);
  }, [tasks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const source = localTasks ?? tasks;

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      (await api.patch(`/tasks/${id}`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['project'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setLocalTasks(null);
    },
    onError: (e: any) => {
      toast(apiError(e, 'Could not move task'), 'error');
      setLocalTasks(null);
    },
  });

  const byStatus = (s: TaskStatus) =>
    [...source].filter((t) => t.status === s).sort((a, b) => a.order - b.order || String(a.createdAt).localeCompare(String(b.createdAt)));

  function findTask(id: string): Task | undefined {
    return source.find((t) => t._id === id);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    if (navigator.vibrate) navigator.vibrate(8);
  }

  function onDragOver(_e: DragOverEvent) {}

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) {
      setLocalTasks(null);
      return;
    }
    const activeTask = findTask(String(active.id));
    let targetStatus: TaskStatus | undefined =
      (over.data.current as any)?.status;

    // Dropped onto another card → infer column from that card
    if (!targetStatus) {
      const overTask = findTask(String(over.id));
      targetStatus = overTask?.status;
    }
    if (!activeTask || !targetStatus) {
      setLocalTasks(null);
      return;
    }

    // Optimistically reorder locally for smooth animation
    const next = [...source];
    const fromIdx = next.findIndex((t) => t._id === activeTask._id);
    const updated = { ...next[fromIdx], status: targetStatus };
    next.splice(fromIdx, 1);
    next.push(updated);
    setLocalTasks(next);

    if (activeTask.status !== targetStatus) {
      move.mutate(
        { id: activeTask._id, status: targetStatus },
        {
          onSuccess: () => toast(`“${activeTask.title}” moved to ${STATUS_META[targetStatus!].label}`),
        }
      );
    }
  }

  const activeTask = activeId ? findTask(activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = byStatus(col.key);
          return (
            <div key={col.key} className="card3d flex min-h-[320px] flex-col !rounded-3xl p-3.5">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.accent, boxShadow: `0 0 10px ${col.accent}` }} />
                  <h3 className="text-xs font-extrabold tracking-[0.14em]" style={{ color: col.accent }}>
                    {col.label}
                  </h3>
                  <span className="chip border border-white/10 bg-white/5">{list.length}</span>
                </div>
                {canEdit && onAddTask && (
                  <button onClick={() => onAddTask(col.key)} className="rounded-lg p-1 text-muted transition hover:bg-white/10 hover:text-white" title={`Add task to ${col.label}`}>
                    <Plus size={15} />
                  </button>
                )}
              </div>

              <SortableContext items={list.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-2.5 overflow-y-auto rounded-2xl p-0.5 transition-colors" data-column={col.key}>
                  {list.map((t) => (
                    <SortableCard key={t._id} task={t} onOpen={() => navigate(`/tasks/${t._id}`)} />
                  ))}
                  {list.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-white/[.08] text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                      Drop here
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }}>
        {activeTask && (
          <div className="w-[280px]">
            <KanbanCard task={activeTask} dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

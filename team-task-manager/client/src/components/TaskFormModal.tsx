import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../api/client';
import type { Project, Task, User } from '../types';
import { Modal } from './ui/feedback';
import { useToast } from '../hooks/useToast';

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

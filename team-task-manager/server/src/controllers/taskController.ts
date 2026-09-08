import type { Response } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Comment } from '../models/Comment';
import { User } from '../models/User';
import { canAccessProject, type AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';
import { audit, logActivity, notify } from '../utils/audit';

const STATUSES = ['todo', 'in_progress', 'review', 'completed'] as const;

function canManage(user: NonNullable<AuthRequest['user']>, project: any): boolean {
  if (user.role === 'admin') return true;
  return user.memberType === 'team_lead' && canAccessProject(user, project);
}

async function loadProjectForTask(projectId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw new HttpError(404, 'Project not found');
  return project;
}

/* GET /api/tasks?project=&status=&priority=&assignee=&search=&due=today|overdue|upcoming&page= */
export const listTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const q: any = {};
  const { project, status, priority, assignee, search, due, mine } = req.query as Record<string, string>;

  let accessibleProjectIds: string[] | null = null;
  if (user.role !== 'admin') {
    const projects = await Project.find({ $or: [{ owner: user._id }, { 'members.user': user._id }] }).select('_id');
    accessibleProjectIds = projects.map((p) => String(p._id));
  }
  if (project && project !== 'all') {
    const p = await loadProjectForTask(project);
    if (!canAccessProject(user, p)) throw new HttpError(403, 'You do not have access to this project.');
    q.project = project;
  } else if (accessibleProjectIds) {
    q.project = { $in: accessibleProjectIds };
  }

  if (status && status !== 'all') q.status = status;
  else if (!status && due !== 'overdue') { /* keep all */ }
  if (priority && priority !== 'all') q.priority = priority;

  if (mine === 'true') q.assignee = user._id;
  else if (assignee === 'unassigned') q.assignee = null;
  else if (assignee && assignee !== 'all') q.assignee = assignee;

  if (search) q.title = { $regex: search, $options: 'i' };
  if (due === 'overdue') {
    q.status = { $ne: 'completed' };
    q.dueDate = { $lt: new Date() };
  } else if (due === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    q.status = { $ne: 'completed' };
    q.dueDate = { $gte: start, $lt: end };
  } else if (due === 'upcoming') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    q.status = { $ne: 'completed' };
    q.dueDate = { $gte: start };
  }

  const page = Math.max(1, parseInt((req.query.page as string) || '1'));
  const limit = Math.min(100, parseInt((req.query.limit as string) || '100'));

  const [tasks, total] = await Promise.all([
    Task.find(q).sort('order createdAt').skip((page - 1) * limit).limit(limit)
      .populate('assignee', 'name avatarColor role memberType')
      .populate('createdBy', 'name')
      .populate('project', 'name color'),
    Task.countDocuments(q),
  ]);

  const commentCounts = await Comment.aggregate([
    { $match: { task: { $in: tasks.map((t: any) => t._id) } } },
    { $group: { _id: '$task', count: { $sum: 1 } } },
  ]);
  const cMap = new Map(commentCounts.map((c) => [String(c._id), c.count]));

  res.json({
    success: true,
    tasks: tasks.map((t: any) => ({ ...t.toObject(), commentCount: cMap.get(String(t._id)) || 0 })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatarColor role memberType jobTitle')
    .populate('createdBy', 'name avatarColor')
    .populate('project', 'name color');
  if (!task) throw new HttpError(404, 'Task not found');
  const project = await loadProjectForTask(String(task.project));
  if (!canAccessProject(req.user!, project)) throw new HttpError(403, 'You do not have access to this task.');

  const comments = await Comment.find({ task: task._id }).sort('createdAt').populate('author', 'name avatarColor');
  res.json({
    success: true,
    task,
    comments,
    permissions: {
      canEdit: canManage(req.user!, project),
      isAssignee: String(task.assignee?._id ?? '') === String(req.user!._id),
      canComment: true,
    },
  });
});

const taskCreateSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000).optional(),
  project: z.string().min(10),
  assignee: z.string().optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  tags: z.array(z.string().max(24)).max(6).optional(),
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = taskCreateSchema.parse(req.body);
  const project = await loadProjectForTask(data.project);
  if (!canAccessProject(req.user!, project)) throw new HttpError(403, 'Forbidden — you are not part of this project.');
  if (!canManage(req.user!, project)) throw new HttpError(403, 'Forbidden — only admins and team leads can create tasks.');

  // Regular members cannot be assigned other people's work; team leads/admins can.
  if (data.assignee && !canManage(req.user!, project)) throw new HttpError(403, 'Forbidden — you cannot assign tasks.');

  const maxOrder = await Task.findOne({ project: project._id }).sort('-order').select('order');
  const task = await Task.create({
    title: data.title,
    description: data.description || '',
    project: project._id,
    createdBy: req.user!._id,
    assignee: data.assignee || undefined,
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || undefined,
    tags: data.tags || [],
    order: (maxOrder?.order ?? -1) + 1,
  });

  await logActivity(req.user!, 'created_task', 'task', { entityId: task._id, project: project._id, meta: { title: task.title, projectName: project.name } });
  if (task.assignee && String(task.assignee) !== String(req.user!._id)) {
    await notify([task.assignee], { type: 'task_assigned', title: 'New task assigned', message: `${req.user!.name} assigned you “${task.title}” in ${project.name}.`, link: `/tasks/${task._id}` });
    await logActivity(req.user!, 'assigned_task', 'task', { entityId: task._id, project: project._id, meta: { title: task.title } });
  }

  const populated = await Task.findById(task._id).populate('assignee', 'name avatarColor').populate('project', 'name color');
  res.status(201).json({ success: true, message: 'Task created successfully', task: { ...populated!.toObject(), commentCount: 0 } });
});

const taskUpdateSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(4000).optional(),
  assignee: z.string().or(z.literal('')).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  tags: z.array(z.string().max(24)).max(6).optional(),
  order: z.number().optional(),
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  const project = await loadProjectForTask(String(task.project));
  const manager = canManage(req.user!, project);
  const selfStatusOnly =
    String(task.assignee ?? '') === String(req.user!._id);

  const data = taskUpdateSchema.parse(req.body);
  const keys = Object.keys(data).filter((k) => (data as any)[k] !== undefined);
  const sensitiveKeys = keys.filter((k) => k !== 'status' && k !== 'order');

  // Regular members may ONLY change the status of their own tasks.
  if (!manager) {
    if (!selfStatusOnly) throw new HttpError(403, 'Forbidden — you cannot modify tasks that are not assigned to you.');
    if (sensitiveKeys.length > 0) throw new HttpError(403, 'Forbidden — you can only update the status of your own tasks.');
  }
  if ((keys.includes('assignee') || keys.includes('order')) && !manager) {
    throw new HttpError(403, 'Forbidden — only team leads and admins re-assign tasks.');
  }

  const prevStatus = task.status;
  if (data.assignee !== undefined) {
    if (data.assignee === '') task.assignee = undefined;
    else {
      const assigneeUser = await User.findById(data.assignee);
      if (!assigneeUser) throw new HttpError(404, 'Assignee not found');
      const inProject = project.members.some((m) => String(m.user) === data.assignee);
      if (!inProject) throw new HttpError(400, 'Assignee must be a member of this project. Add them first.');
      task.assignee = data.assignee as any;
    }
  }
  if (data.dueDate !== undefined) task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.status !== undefined) task.status = data.status;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.tags !== undefined) task.tags = data.tags;
  if (data.order !== undefined) task.order = data.order;

  await task.save();

  if (data.status && data.status !== prevStatus) {
    await logActivity(req.user!, data.status === 'completed' ? 'completed_task' : 'changed_status', 'task', {
      entityId: task._id, project: project._id, meta: { title: task.title, from: prevStatus, to: data.status },
    });
    const watchers = [...new Set([task.assignee, task.createdBy].filter(Boolean).map(String))];
    await notify(watchers, {
      type: 'status_changed',
      title: `Task moved to ${STATUSES.find((s) => s === data.status)?.replace('_', ' ')}`,
      message: `“${task.title}” was ${data.status === 'completed' ? 'completed' : `moved from ${prevStatus.replace('_', ' ')} to ${String(data.status).replace('_', ' ')}`} by ${req.user!.name}.`,
      link: `/tasks/${task._id}`,
    }, req.user!._id);
  } else if (sensitiveKeys.length) {
    await logActivity(req.user!, 'updated_task', 'task', { entityId: task._id, project: project._id, meta: { title: task.title } });
    if (task.assignee && keys.includes('assignee')) {
      await notify([task.assignee], { type: 'task_assigned', title: 'Task assigned to you', message: `“${task.title}” was assigned to you by ${req.user!.name}.`, link: `/tasks/${task._id}` }, req.user!._id);
    }
  }

  const populated = await Task.findById(task._id).populate('assignee', 'name avatarColor').populate('project', 'name color');
  const commentCount = await Comment.countDocuments({ task: task._id });
  res.json({ success: true, message: 'Task updated successfully', task: { ...populated!.toObject(), commentCount } });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  const project = await loadProjectForTask(String(task.project));
  if (!canManage(req.user!, project)) throw new HttpError(403, 'Forbidden — only team leads and admins can delete tasks.');

  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();
  await audit(req, { actor: req.user!, action: 'task_deleted', targetModel: 'Task', targetId: task._id as any, targetLabel: task.title });
  res.json({ success: true, message: 'Task deleted successfully' });
});

/** Attachments are stored inline (small files ≤ 2 MB) for demo simplicity. */
export const addAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  const project = await loadProjectForTask(String(task.project));
  if (!canAccessProject(req.user!, project)) throw new HttpError(403, 'Forbidden');

  const schema = z.object({ filename: z.string().min(1).max(200), mimeType: z.string().max(100), size: z.number().max(2 * 1024 * 1024), dataBase64: z.string().max(3_000_000).optional() });
  const body = schema.parse(req.body);

  task.attachments.push({
    filename: body.filename,
    mimeType: body.mimeType || 'application/octet-stream',
    size: body.size || 0,
    uploadedBy: req.user!._id as any,
    data: body.dataBase64 ? Buffer.from(body.dataBase64, 'base64') : undefined,
    uploadedAt: new Date(),
  });
  await task.save();
  await logActivity(req.user!, 'updated_task', 'task', { entityId: task._id, project: project._id, meta: { attachment: body.filename } });
  res.json({ success: true, message: 'Attachment uploaded', attachments: task.attachments });
});

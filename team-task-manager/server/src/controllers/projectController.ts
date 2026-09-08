import type { Response } from 'express';
import { z } from 'zod';
import { Project, type IProject } from '../models/Project';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { canAccessProject, type AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';
import { audit, logActivity, notify } from '../utils/audit';

const projectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  color: z.string().max(20).optional(),
  deadline: z.string().datetime({ offset: true }).optional().or(z.literal('')).transform((v) => v || undefined),
  startDate: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  tags: z.array(z.string().max(30)).max(8).optional(),
});

async function withStats(projects: IProject[]) {
  const ids = projects.map((p) => p._id);
  const stats = await Task.aggregate([
    { $match: { project: { $in: ids } } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
        todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$status', 'completed'] }, { $ne: ['$dueDate', null] }, { $lt: ['$dueDate', new Date()] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  return projects.map((p) => {
    const s: any = map.get(String(p._id)) || { total: 0, completed: 0, in_progress: 0, review: 0, todo: 0, overdue: 0 };
    const progress = s.total ? Math.round((s.completed / s.total) * 100) : 0;
    return {
      ...p.toObject(),
      stats: { ...s, progress },
    };
  });
}

/** GET /api/projects — scoped to role & membership */
export const listProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { status, search, includeArchived } = req.query as Record<string, string>;
  const q: any = {};
  if (user.role !== 'admin') {
    q.$or = [{ owner: user._id }, { 'members.user': user._id }];
  }
  if (includeArchived !== 'true') q.status = { ...(q.status || {}), $ne: 'archived' };
  if (status && status !== 'all') q.status = status as any;
  if (search) q.name = { $regex: search, $options: 'i' };

  let projects = await Project.find(q).sort('-createdAt').populate('owner', 'name avatarColor').populate('members.user', 'name email avatarColor role memberType');
  res.json({ success: true, projects: await withStats(projects) });
});

/** GET /api/projects/:id — full workspace payload */
export const getProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatarColor jobTitle')
    .populate('members.user', 'name email avatarColor role memberType lastLogin');
  if (!project) throw new HttpError(404, 'Project not found');
  if (!canAccessProject(req.user!, project)) throw new HttpError(403, 'You do not have access to this project.');

  const [withStatsProject] = await withStats([project]);
  res.json({ success: true, project: withStatsProject });
});

const requireAdminSync = (req: AuthRequest) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden — administrator access required.');
};

export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdminSync(req);
  const data = projectSchema.parse(req.body);

  const project = await Project.create({
    ...data,
    owner: req.user!._id,
    members: [{ user: req.user!._id, projectRole: 'lead', addedAt: new Date() }],
  });
  await logActivity(req.user!, 'created_project', 'project', { entityId: project._id, project: project._id, meta: { name: project.name } });
  await audit(req, { actor: req.user!, action: 'project_created', targetModel: 'Project', targetId: project._id as any, targetLabel: project.name });
  res.status(201).json({ success: true, project });
});

export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdminSync(req);
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');

  const data = projectSchema.partial().parse(req.body);
  Object.assign(project, data);
  await project.save();
  await logActivity(req.user!, 'updated_project', 'project', { entityId: project._id, project: project._id, meta: { name: project.name } });
  await audit(req, { actor: req.user!, action: 'project_updated', targetModel: 'Project', targetId: project._id as any, targetLabel: project.name });
  res.json({ success: true, project });
});

export const archiveProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdminSync(req);
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  project.status = 'archived';
  await project.save();
  await logActivity(req.user!, 'archived_project', 'project', { entityId: project._id, project: project._id, meta: { name: project.name } });
  await audit(req, { actor: req.user!, action: 'project_archived', targetModel: 'Project', targetId: project._id as any, targetLabel: project.name });
  res.json({ success: true, message: 'Project archived' });
});

export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdminSync(req);
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');

  await Task.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await project.deleteOne();

  await audit(req, { actor: req.user!, action: 'project_deleted', targetModel: 'Project', targetId: project._id as any, targetLabel: project.name });
  res.json({ success: true, message: 'Project deleted successfully' });
});

/* -------- Members -------- */

export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  const isAdmin = req.user!.role === 'admin';
  const isLeadMember =
    req.user!.memberType === 'team_lead' &&
    project.members.some((m) => String(m.user) === String(req.user!._id));
  if (!isAdmin && !isLeadMember) throw new HttpError(403, 'Forbidden — you cannot manage members of this project.');

  const schema = z.object({ userId: z.string().min(10), projectRole: z.enum(['lead', 'member']).default('member') });
  const { userId, projectRole } = schema.parse(req.body);
  if (project.members.some((m) => String(m.user) === userId)) throw new HttpError(409, 'User is already a project member.');
  if (!isAdmin && projectRole === 'lead') throw new HttpError(403, 'Only administrators can assign the lead role.');

  const user = await User.findById(userId);
  if (!user || !user.active) throw new HttpError(404, 'User not found or inactive');
  project.members.push({ user: user._id as any, projectRole, addedAt: new Date() });
  await project.save();

  await notify([user._id], { type: 'project', title: 'Added to project', message: `You were added to “${project.name}”.`, link: `/projects/${project._id}` });
  await logActivity(req.user!, 'added_member', 'project', { entityId: project._id, project: project._id, meta: { member: user.name, projectName: project.name } });
  res.json({ success: true, message: `${user.name} added`, project });
});

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  const isAdmin = req.user!.role === 'admin';
  const isLeadMember = req.user!.memberType === 'team_lead' && project.members.some((m) => String(m.user) === String(req.user!._id));
  if (!isAdmin && !isLeadMember) throw new HttpError(403, 'Forbidden — you cannot manage members of this project.');

  const memberId = req.params.userId;
  if (String(project.owner) === memberId) throw new HttpError(400, 'The project owner cannot be removed.');
  project.members = project.members.filter((m) => String(m.user) !== memberId);
  // Unassign their open tasks rather than deleting them.
  await Task.updateMany({ project: project._id, assignee: memberId, status: { $ne: 'completed' } }, { $unset: { assignee: '' } });
  await project.save();

  await notify([memberId], { type: 'project', title: 'Removed from project', message: `You were removed from “${project.name}”.` });
  await logActivity(req.user!, 'removed_member', 'project', { entityId: project._id, project: project._id, meta: { projectName: project.name } });
  res.json({ success: true, message: 'Member removed', project });
});

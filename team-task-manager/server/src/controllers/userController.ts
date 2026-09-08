import type { Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { type AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';
import { audit, notify } from '../utils/audit';

const publicUser = (u: any) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  memberType: u.memberType,
  jobTitle: u.jobTitle,
  avatarColor: u.avatarColor,
  active: u.active,
  lastLogin: u.lastLogin,
  notificationPrefs: u.notificationPrefs,
  createdAt: u.createdAt,
});

/* ---------------- Admin: full user management ---------------- */

const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['admin', 'member']),
  memberType: z.enum(['team_lead', 'regular_member', 'none']).optional(),
  jobTitle: z.string().max(80).optional(),
});

export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createUserSchema.parse(req.body);

  if (await User.findOne({ email: data.email.toLowerCase() })) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    memberType: data.role === 'admin' ? null : (data.memberType === 'none' ? null : data.memberType ?? 'regular_member'),
    jobTitle: data.jobTitle || '',
  });

  await notify([user._id], {
    type: 'security',
    title: 'Welcome to Team Task Manager',
    message: `${req.user!.name} created your account.`,
    link: '/dashboard',
  });
  await audit(req, {
    actor: req.user!,
    action: 'user_created',
    targetModel: 'User',
    targetId: user._id as any,
    targetLabel: user.email,
    meta: { role: user.role, memberType: user.memberType },
  });

  res.status(201).json({ success: true, user: publicUser(user) });
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'member']).optional(),
  memberType: z.enum(['team_lead', 'regular_member', 'none']).optional(),
  jobTitle: z.string().max(80).optional(),
  active: z.boolean().optional(),
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new HttpError(404, 'User not found');

  // Only admins may edit other users; users can edit themselves via /profile.
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden — administrator access required.');

  const data = updateUserSchema.parse(req.body);
  const changes: string[] = [];
  if (data.role && data.role !== target.role) changes.push(`role ${target.role}→${data.role}`);
  if (data.memberType && data.memberType !== target.memberType) changes.push(`memberType ${target.memberType}→${data.memberType}`);
  if (typeof data.active === 'boolean' && data.active !== target.active) changes.push(data.active ? 'activated' : 'deactivated');

  if (String(target._id) === String(req.user!._id) && data.role === 'member') {
    throw new HttpError(400, 'You cannot demote your own admin account.');
  }
  if (String(target._id) === String(req.user!._id) && data.active === false) {
    throw new HttpError(400, 'You cannot deactivate your own account.');
  }

  Object.assign(target, {
    ...data,
    email: data.email?.toLowerCase() ?? target.email,
    ...(data.role === 'admin' ? {} : {}),
  });
  if (data.memberType === 'none') target.memberType = null;
  if (data.role === 'admin') target.memberType = null;
  await target.save();

  if (typeof data.active === 'boolean') {
    if (!data.active) target.sessions = [];
    await notify([target._id], {
      type: 'security',
      title: data.active ? 'Account activated' : 'Account deactivated',
      message: `Your account was ${data.active ? 'activated' : 'deactivated'} by an administrator.`,
      link: '/login',
    });
  }
  await audit(req, {
    actor: req.user!, action: 'user_updated', targetModel: 'User',
    targetId: target._id as any, targetLabel: target.email, meta: { changes },
  });
  res.json({ success: true, user: publicUser(target) });
});

/** Admin resets a user's password to a temporary value. */
export const resetUserPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden — administrator access required.');
  const schema = z.object({ newPassword: z.string().min(8).max(72) });
  const { newPassword } = schema.parse(req.body);
  const target = await User.findById(req.params.id).select('+password');
  if (!target) throw new HttpError(404, 'User not found');

  target.password = newPassword;
  target.sessions = [];
  await target.save();

  await notify([target._id], { type: 'security', title: 'Password reset by admin', message: 'An administrator reset your password. Sign in with the temporary password.', link: '/login' });
  await audit(req, { actor: req.user!, action: 'password_reset_by_admin', targetModel: 'User', targetId: target._id as any, targetLabel: target.email });
  res.json({ success: true, message: 'Password reset successfully' });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden — administrator access required.');
  const target = await User.findById(req.params.id);
  if (!target) throw new HttpError(404, 'User not found');
  if (String(target._id) === String(req.user!._id)) throw new HttpError(400, 'You cannot delete your own account.');

  // Detach instead of cascading deletes to preserve project history.
  await Task.updateMany({ assignee: target._id }, { $unset: { assignee: '' } });
  await Project.updateMany({ owner: target._id }, { $set: { status: 'archived' } });
  await Project.updateMany({ 'members.user': target._id }, { $pull: { members: { user: target._id } } });
  await target.deleteOne();

  await audit(req, { actor: req.user!, action: 'user_deleted', targetModel: 'User', targetId: req.params.id as any, targetLabel: target.email });
  res.json({ success: true, message: 'User deleted successfully' });
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden — administrator access required.');
  const { search = '', role, active, sort = '-createdAt' } = req.query as Record<string, string>;
  const q: any = {};
  if (search) q.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  if (role && role !== 'all') q.role = role;
  if (active && active !== 'all') q.active = active === 'true';

  const page = Math.max(1, parseInt((req.query.page as string) || '1'));
  const limit = Math.min(50, parseInt((req.query.limit as string) || '20'));

  const [users, total] = await Promise.all([
    User.find(q).sort(sort).skip((page - 1) * limit).limit(limit),
    User.countDocuments(q),
  ]);

  const userIds = users.map((u) => u._id);
  const taskCounts = await Task.aggregate([
    { $match: { assignee: { $in: userIds } } },
    { $group: { _id: { user: '$assignee', status: '$status' }, count: { $sum: 1 } } },
  ]);
  const countsByUser = new Map<string, { total: number; completed: number; pending: number }>();
  for (const t of taskCounts) {
    const key = String(t._id.user);
    const entry = countsByUser.get(key) || { total: 0, completed: 0, pending: 0 };
    entry.total += t.count;
    if (t._id.status === 'completed') entry.completed += t.count;
    else entry.pending += t.count;
    countsByUser.set(key, entry);
  }

  res.json({
    success: true,
    users: users.map((u) => ({
      ...publicUser(u),
      stats: countsByUser.get(String(u._id)) || { total: 0, completed: 0, pending: 0 },
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/* ---------------- Team directory (all authenticated users) ---------------- */

export const directory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await User.find({ active: true }).sort('name');
  const ids = users.map((u) => u._id);
  const taskAgg = await Task.aggregate([
    { $match: { assignee: { $in: ids } } },
    { $group: { _id: '$assignee', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, open: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } } } },
  ]);
  const byUser = new Map(taskAgg.map((r) => [String(r._id), r]));

  const projectsPerUser = await Project.aggregate([
    { $unwind: '$members' },
    { $match: { 'members.user': { $in: ids }, status: { $ne: 'archived' } } },
    { $group: { _id: '$members.user', count: { $sum: 1 }, projects: { $push: { id: '$_id', name: '$name', color: '$color' } } } },
  ]);
  const projByUser = new Map(projectsPerUser.map((r) => [String(r._id), r]));

  res.json({
    success: true,
    members: users.map((u) => {
      const s: any = byUser.get(String(u._id)) || { total: 0, completed: 0, open: 0 };
      const p: any = projByUser.get(String(u._id)) || { count: 0, projects: [] };
      return {
        id: u._id, name: u.name, email: u.email, role: u.role, memberType: u.memberType,
        jobTitle: u.jobTitle, avatarColor: u.avatarColor, lastLogin: u.lastLogin,
        workload: s.open, completed: s.completed, productivity: s.total ? Math.round((s.completed / s.total) * 100) : 0,
        projectCount: p.count, projects: (p.projects || []).slice(0, 4),
      };
    }),
  });
});

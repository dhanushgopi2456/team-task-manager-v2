import { z } from 'zod';
import type { Response } from 'express';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { type AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

export const getProfile = asyncHandler(async (req: AuthRequest, res: any) => {
  const user = req.user!;
  const [openTasks, completedTasks] = await Promise.all([
    Task.countDocuments({ assignee: user._id, status: { $ne: 'completed' } }),
    Task.countDocuments({ assignee: user._id, status: 'completed' }),
  ]);
  const projects = await Project.find({
    $or: [{ owner: user._id }, { 'members.user': user._id }],
    status: { $ne: 'archived' },
  }).select('name color status');

  res.json({
    success: true,
    profile: {
      id: user._id, name: user.name, email: user.email, role: user.role, memberType: user.memberType,
      jobTitle: user.jobTitle, avatarColor: user.avatarColor, active: user.active,
      lastLogin: user.lastLogin, notificationPrefs: user.notificationPrefs, createdAt: user.createdAt,
      sessions: user.sessions,
      stats: { openTasks, completedTasks, projectCount: projects.length },
      projects,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: any) => {
  const schema = z.object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().optional(),
    jobTitle: z.string().max(80).optional(),
    avatarColor: z.enum(AVATAR_COLORS as [string, ...string[]]).optional(),
    notificationPrefs: z
      .object({ email: z.boolean(), tasks: z.boolean(), deadlines: z.boolean() })
      .partial()
      .optional(),
  });
  const data = schema.parse(req.body);

  const user = await User.findById(req.user!._id);
  if (!user) throw new HttpError(404, 'User not found');

  if (data.name !== undefined) user.name = data.name;
  if (data.jobTitle !== undefined) user.jobTitle = data.jobTitle;
  if (data.avatarColor !== undefined) user.avatarColor = data.avatarColor;
  if (data.email !== undefined && data.email.toLowerCase() !== user.email) {
    if (await User.findOne({ email: data.email.toLowerCase() })) throw new HttpError(409, 'Email already in use');
    user.email = data.email.toLowerCase();
  }
  if (data.notificationPrefs) {
    user.notificationPrefs = { ...user.notificationPrefs, ...data.notificationPrefs } as any;
  }
  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id, name: user.name, email: user.email, role: user.role, memberType: user.memberType,
      jobTitle: user.jobTitle, avatarColor: user.avatarColor, active: user.active,
      lastLogin: user.lastLogin, notificationPrefs: user.notificationPrefs, createdAt: user.createdAt,
    },
  });
});

import { z } from 'zod';
import type { Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { getSettings, SystemSetting } from '../models/SystemSetting';
import { User } from '../models/User';
import type { AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';

const PERMISSION_MATRIX = [
  {
    role: 'ADMIN', memberType: null as string | null,
    summary: 'Full System Access',
    description: 'Complete platform control including users, roles, projects and security.',
    categories: [
      { name: 'Users', level: 3 }, { name: 'Projects', level: 3 }, { name: 'Tasks', level: 3 },
      { name: 'Teams', level: 3 }, { name: 'Reports', level: 3 }, { name: 'Notifications', level: 3 },
      { name: 'Settings', level: 3 }, { name: 'Audit Logs', level: 3 },
    ],
  },
  {
    role: 'TEAM LEAD', memberType: 'team_lead',
    summary: 'Project & Team Management',
    description: 'Creates and assigns tasks inside assigned projects and tracks delivery.',
    categories: [
      { name: 'Users', level: 0 }, { name: 'Projects', level: 1 }, { name: 'Tasks', level: 2 },
      { name: 'Teams', level: 2 }, { name: 'Reports', level: 2 }, { name: 'Notifications', level: 1 },
      { name: 'Settings', level: 0 }, { name: 'Audit Logs', level: 0 },
    ],
  },
  {
    role: 'REGULAR MEMBER', memberType: 'regular_member',
    summary: 'Assigned Task Management',
    description: 'Works on assigned tasks, updates status and collaborates via comments.',
    categories: [
      { name: 'Users', level: 0 }, { name: 'Projects', level: 0 }, { name: 'Tasks', level: 1 },
      { name: 'Teams', level: 0 }, { name: 'Reports', level: 1 }, { name: 'Notifications', level: 1 },
      { name: 'Settings', level: 0 }, { name: 'Audit Logs', level: 0 },
    ],
  },
] as const;

export const permissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden');
  res.json({
    success: true,
    levels: ['No Access', 'View', 'Manage', 'Full Control'],
    matrix: PERMISSION_MATRIX,
  });
});

/* ---------------- Audit logs ---------------- */

export const auditLogs = asyncHandler(async (req: AuthRequest, res: any) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden');
  const { search = '', action = 'all', result = 'all' } = req.query as Record<string, string>;
  const q: any = {};
  if (search) q.$or = [{ actorName: new RegExp(search, 'i') }, { action: new RegExp(search, 'i') }, { targetLabel: new RegExp(search, 'i') }];
  if (action !== 'all') q.action = action;
  if (result !== 'all') q.result = result;

  const page = Math.max(1, parseInt((req.query.page as string) || '1'));
  const limit = Math.min(100, parseInt((req.query.limit as string) || '25'));

  const [logs, total, actions] = await Promise.all([
    AuditLog.find(q).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(q),
    AuditLog.distinct('action'),
  ]);
  res.json({ success: true, logs, actions: actions.sort(), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/* ---------------- System settings ---------------- */

export const getSystemSettings = asyncHandler(async (req: AuthRequest, res: any) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden');
  const settings = await getSettings();
  res.json({ success: true, settings });
});

export const updateSystemSettings = asyncHandler(async (req: AuthRequest, res: any) => {
  if (req.user!.role !== 'admin') throw new HttpError(403, 'Forbidden');
  const schema = z.object({
    allowRegistration: z.boolean().optional(),
    defaultMemberType: z.enum(['team_lead', 'regular_member']).optional(),
    emailNotifications: z.boolean().optional(),
    taskNotifications: z.boolean().optional(),
    deadlineReminders: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
    sessionDays: z.number().int().min(1).max(90).optional(),
  });
  const data = schema.parse(req.body);
  await SystemSetting.updateOne({ key: 'global' }, data, { upsert: true });

  const settings = await getSettings();
  const { audit } = await import('../utils/audit');
  await audit(req, { actor: req.user!, action: 'system_settings_updated', targetModel: 'SystemSetting', meta: data });
  res.json({ success: true, message: 'Settings saved successfully', settings });
});

/** Public-ish bootstrap info for the login screen (safe fields only). */
export const publicInfo = asyncHandler(async (_req: AuthRequest, res: any) => {
  const settings = await getSettings().catch(() => null);
  res.json({
    success: true,
    appName: settings?.appName ?? 'Team Task Manager',
    allowRegistration: settings?.allowRegistration ?? true,
  });
});

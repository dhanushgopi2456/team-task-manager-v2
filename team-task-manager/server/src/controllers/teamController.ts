import { z } from 'zod';
import type { Response } from 'express';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { isTeamLeadOrAdmin, type AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';
import { audit } from '../utils/audit';

export const listTeams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const teams = await Team.find()
    .populate('lead', 'name avatarColor role memberType')
    .populate('members', 'name avatarColor role memberType jobTitle lastLogin');

  const memberIds = new Set<string>();
  teams.forEach((t) => t.members.forEach((m) => memberIds.add(String((m as any)._id))));
  const agg = await Task.aggregate([
    { $match: { assignee: { $in: [...memberIds].map((id) => id as any) } } },
    {
      $group: {
        _id: '$assignee',
        open: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
  ]);
  const stats = new Map(agg.map((a) => [String(a._id), a]));

  res.json({
    success: true,
    teams: teams.map((t) => ({
      ...t.toObject(),
      members: (t.members as any[]).map((m) => ({
        ...(m as any).toObject?.() ?? m,
        workload: stats.get(String(m._id))?.open ?? 0,
        completed: stats.get(String(m._id))?.completed ?? 0,
      })),
    })),
  });
});

export const createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!isTeamLeadOrAdmin(req.user!)) throw new HttpError(403, 'Forbidden — team lead access required.');
  const schema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    memberIds: z.array(z.string()).max(50).optional(),
    leadId: z.string().optional(),
  });
  const data = schema.parse(req.body);

  if (data.memberIds?.length) {
    const found = await User.countDocuments({ _id: { $in: data.memberIds } });
    if (found !== data.memberIds.length) throw new HttpError(400, 'One or more members do not exist');
  }
  const team = await Team.create({
    name: data.name,
    description: data.description || '',
    lead: (data.leadId || req.user!._id) as any,
    members: [...new Set([...(data.memberIds || []), String(data.leadId ?? req.user!._id)])] as any,
  });
  await audit(req, { actor: req.user!, action: 'team_created', targetModel: 'Team', targetId: team._id as any, targetLabel: team.name });
  res.status(201).json({ success: true, team });
});

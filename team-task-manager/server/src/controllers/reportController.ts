import { User } from '../models/User';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { AuditLog } from '../models/AuditLog';
import type { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/helpers';

const DAY = 24 * 60 * 60 * 1000;

async function projectScope(req: AuthRequest) {
  if (req.user!.role === 'admin') return null;
  const projects = await Project.find({ $or: [{ owner: req.user!._id }, { 'members.user': req.user!._id }] }).select('_id');
  return projects.map((p) => p._id);
}

/** GET /api/reports/dashboard — role-aware KPI payload */
export const dashboard = asyncHandler(async (req: AuthRequest, res: any) => {
  const user = req.user!;
  const scope = await projectScope(req);
  const taskQ: any = scope ? { project: { $in: scope } } : {};

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
  const weekAgo = new Date(now.getTime() - 6 * DAY);

  const [totalProjectsRaw, totalTasks, completedTasks, pendingTasks, overdueTasks, dueToday, activeUsers] =
    await Promise.all([
      scope
        ? Project.countDocuments({ _id: { $in: scope }, status: { $ne: 'archived' } })
        : Project.countDocuments({ status: { $ne: 'archived' } }),
      Task.countDocuments(taskQ),
      Task.countDocuments({ ...taskQ, status: 'completed' }),
      Task.countDocuments({ ...taskQ, status: { $ne: 'completed' } }),
      Task.countDocuments({ ...taskQ, status: { $ne: 'completed' }, dueDate: { $lt: now, $ne: null } }),
      Task.find({ ...taskQ, status: { $ne: 'completed' }, dueDate: { $gte: startToday, $lt: endToday } })
        .sort('dueDate').limit(8).populate('project', 'name color').populate('assignee', 'name avatarColor'),
      User.countDocuments({ role: 'member', active: true }),
    ]);

  // Weekly productivity (last 7 days completions)
  const weeklyAgg = await Task.aggregate([
    { $match: { ...taskQ, status: 'completed', completedAt: { $gte: weekAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
  ]);
  const byDay = new Map(weeklyAgg.map((r) => [r._id, r.count]));
  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getTime() - (6 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { day: key, label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], completed: byDay.get(key) || 0 };
  });

  const myOpen = await Task.countDocuments({ ...taskQ, assignee: user._id, status: { $ne: 'completed' } });
  const myCompleted = await Task.countDocuments({ ...taskQ, assignee: user._id, status: 'completed' });
  const completion = myCompleted + myOpen > 0 ? myCompleted / (myCompleted + myOpen) : 0;
  const productivityScore = Math.min(100, Math.round(completion * 70 + Math.min(30, myCompleted * 5)));

  const recentActivity = await Activity.find(scope ? { project: { $in: scope } } : {})
    .sort('-createdAt').limit(8).populate('actor', 'name avatarColor');

  const inProgress = totalTasks - completedTasks - pendingTasks >= 0 ? await Task.countDocuments({ ...taskQ, status: 'in_progress' }) : 0;
  const review = await Task.countDocuments({ ...taskQ, status: 'review' });

  res.json({
    success: true,
    kpis: {
      totalProjects: totalProjectsRaw,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      teamMembers: user.role === 'admin' || user.memberType === 'team_lead'
        ? await User.countDocuments({ role: 'member', active: true })
        : activeUsers,
    },
    statusBreakdown: { todo: Math.max(0, pendingTasks - inProgress - review), in_progress: inProgress, review, completed: completedTasks },
    weeklyProductivity: weekly,
    dueToday,
    recentActivity,
    me: { open: myOpen, completed: myCompleted, productivityScore },
  });
});

/** GET /api/reports?from=&to= — full analytics for Reports page */
export const reports = asyncHandler(async (req: AuthRequest, res: any) => {
  const user = req.user!;
  const scope = await projectScope(req);
  const taskQ: any = scope ? { project: { $in: scope } } : {};
  const isAdminOrLead = user.role === 'admin' || user.memberType === 'team_lead';

  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * DAY);
  const to = req.query.to ? new Date(String(req.query.to) + 'T23:59:59') : new Date();
  const createdIn = { createdAt: { $gte: from, $lte: to } };

  const [total, completed, overdue, inProgress, review, todo] = await Promise.all([
    Task.countDocuments({ ...taskQ, ...createdIn }),
    Task.countDocuments({ ...taskQ, ...createdIn, status: 'completed' }),
    Task.countDocuments({ ...taskQ, status: { $ne: 'completed' }, dueDate: { $lt: new Date(), $ne: null } }),
    Task.countDocuments({ ...taskQ, status: 'in_progress' }),
    Task.countDocuments({ ...taskQ, status: 'review' }),
    Task.countDocuments({ ...taskQ, status: 'todo' }),
  ]);

  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const overduePct = total ? Math.round((overdue / Math.max(1, overdue + completed)) * 100) : 0;

  // Weekly trend across range
  const weeks = Math.max(1, Math.min(12, Math.ceil((to.getTime() - from.getTime()) / (7 * DAY))));
  const trendAgg = await Task.aggregate([
    { $match: { ...taskQ, status: 'completed', completedAt: { $gte: from, $lte: to } } },
    { $group: { _id: { week: { $week: '$completedAt' }, year: { $year: '$completedAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);
  const trend = trendAgg.slice(-weeks).map((w, i) => ({ label: `W${i + 1}`, completed: w.count }));

  // Workload & member performance (visible to admins and leads)
  let members: any[] = [];
  if (isAdminOrLead) {
    const agg = await Task.aggregate([
      { $match: taskQ },
      { $group: {
        _id: '$assignee',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        open: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } },
      } },
    ]);
    const users = await User.find({ role: 'member' }).select('name avatarColor memberType jobTitle');
    const map = new Map(agg.filter((a) => a._id).map((a) => [String(a._id), a]));
    members = users.map((u: any) => {
      const s: any = map.get(String(u._id)) || { total: 0, completed: 0, open: 0 };
      return {
        id: u._id, name: u.name, avatarColor: u.avatarColor, memberType: u.memberType, jobTitle: u.jobTitle,
        total: s.total, completed: s.completed, open: s.open,
        rate: s.total ? Math.round((s.completed / s.total) * 100) : 0,
      };
    }).sort((a, b) => b.completed - a.completed);
  }

  const projects = await Project.find(scope ? { _id: { $in: scope } } : {}).select('name color status deadline');
  const projectStats = await Task.aggregate([
    ...(scope ? [{ $match: { project: { $in: scope } } }] : []),
    { $group: {
      _id: '$project',
      total: { $sum: 1 },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'completed'] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] } },
    } },
  ]);
  const pMap = new Map(projectStats.map((p) => [String(p._id), p]));
  const projectReport = projects.map((p: any) => {
    const s: any = pMap.get(String(p._id)) || { total: 0, completed: 0, overdue: 0 };
    return { id: p._id, name: p.name, color: p.color, deadline: p.deadline, total: s.total, completed: s.completed, overdue: s.overdue, progress: s.total ? Math.round((s.completed / s.total) * 100) : 0 };
  });

  res.json({
    success: true,
    summary: { total, completed, overdue, inProgress, review, todo, completionRate, overduePct },
    statusDistribution: [
      { name: 'To Do', value: todo, key: 'todo' },
      { name: 'In Progress', value: inProgress, key: 'in_progress' },
      { name: 'Review', value: review, key: 'review' },
      { name: 'Completed', value: completed, key: 'completed' },
    ],
    trend,
    members,
    projects: projectReport,
  });
});

/** GET /api/admin/analytics — system overview for Admin Dashboard */
export const adminAnalytics = asyncHandler(async (req: AuthRequest, res: any) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

  const [totalUsers, activeUsers, inactiveUsers, admins, teamLeads, regularMembers, totalProjects, archivedProjects, totalTasks, recentLogins] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.countDocuments({ active: false }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'member', memberType: 'team_lead', active: true }),
      User.countDocuments({ role: 'member', memberType: 'regular_member', active: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'archived' }),
      Task.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 7 * DAY) } }),
    ]);

  const securityEvents = await AuditLog.countDocuments({
    $or: [{ result: 'failure' }, { action: { $regex: /^(login_failed|password_|user_deleted|role_)/ } }],
  });

  const activityByDay = await AuditLog.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 7 * DAY) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  const byDay = new Map(activityByDay.map((r) => [r._id, r.count]));
  const systemActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { day: key, events: byDay.get(key) || 0 };
  });

  const recentAudit = await AuditLog.find().sort('-createdAt').limit(6);

  res.json({
    success: true,
    users: { totalUsers, activeUsers, inactiveUsers, admins, teamLeads, regularMembers, recentLogins },
    platform: { totalProjects, archivedProjects, totalTasks, securityEvents },
    systemActivity,
    recentAudit,
  });
});

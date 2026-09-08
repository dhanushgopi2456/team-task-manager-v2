import { Activity } from '../models/Activity';
import { Project } from '../models/Project';
import { asyncHandler } from '../utils/helpers';

/** GET /api/activity?projectId= — role-scoped activity feed */
export const feed = asyncHandler(async (req: any, res: any) => {
  const q: any = {};
  const { projectId } = req.query;

  if (projectId && projectId !== 'all') {
    q.project = projectId;
  } else if (req.user.role !== 'admin') {
    const projects = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] }).select('_id');
    q.project = { $in: projects.map((p) => p._id) };
  }

  const activities = await Activity.find(q)
    .sort('-createdAt')
    .limit(Math.min(60, parseInt(req.query.limit || '30')))
    .populate('actor', 'name avatarColor role memberType');

  res.json({ success: true, activities });
});

import { z } from 'zod';
import { Comment } from '../models/Comment';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { canAccessProject, type AuthRequest } from '../middleware/auth';
import { HttpError, asyncHandler } from '../utils/helpers';
import { logActivity, notify } from '../utils/audit';

export const listComments = asyncHandler(async (req: AuthRequest, res: any) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new HttpError(404, 'Task not found');
  const project = await Project.findById(task.project);
  if (!project || !canAccessProject(req.user!, project)) throw new HttpError(403, 'Forbidden');

  const comments = await Comment.find({ task: task._id }).sort('createdAt').populate('author', 'name avatarColor role memberType');
  res.json({ success: true, comments });
});

export const addComment = asyncHandler(async (req: AuthRequest, res: any) => {
  const schema = z.object({ body: z.string().min(1).max(2000) });
  const { body } = schema.parse(req.body);

  const task = await Task.findById(req.params.taskId).populate('assignee', 'name');
  if (!task) throw new HttpError(404, 'Task not found');
  const project = await Project.findById(task.project);
  if (!project || !canAccessProject(req.user!, project)) throw new HttpError(403, 'Forbidden');

  const comment = await Comment.create({ task: task._id, author: req.user!._id, body });
  await comment.populate('author', 'name avatarColor');

  // Mention support: @name highlights
  if (/@\S+/.test(body)) {
    const mentioned = project.members.map((m) => String(m.user)).filter(() => true);
    await notify(mentioned, {
      type: 'mention',
      title: `You were mentioned`,
      message: `${req.user!.name} commented on “${task.title}”.`,
      link: `/tasks/${task._id}`,
    }, req.user!._id);
  } else if (String(task.assignee ?? '') !== String(req.user!._id) && task.assignee) {
    await notify([task.assignee], {
      type: 'comment',
      title: 'New comment on your task',
      message: `${req.user!.name} commented on “${task.title}”.`,
      link: `/tasks/${task._id}`,
    });
  }

  await logActivity(req.user!, 'added_comment', 'comment', { entityId: comment._id, project: project._id, meta: { taskTitle: task.title } });
  res.status(201).json({ success: true, message: 'Comment added', comment });
});

export const deleteComment = asyncHandler(async (req: AuthRequest, res: any) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new HttpError(404, 'Comment not found');
  if (String(comment.author) !== String(req.user!._id) && req.user!.role !== 'admin') {
    throw new HttpError(403, 'You can only delete your own comments.');
  }
  await comment.deleteOne();
  res.json({ success: true, message: 'Comment deleted' });
});

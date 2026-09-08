import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/helpers';

export const listNotifications = asyncHandler(async (req: any, res: any) => {
  const page = Math.max(1, parseInt(req.query.page || '1'));
  const limit = Math.min(50, parseInt(req.query.limit || '20'));
  const filter: any = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, notifications, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const markRead = asyncHandler(async (req: any, res: any) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ success: true });
});

export const markAllRead = asyncHandler(async (req: any, res: any) => {
  const r = await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: `${r.modifiedCount} notifications marked as read` });
});

import type { Request } from 'express';
import type { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { Activity, type IActivity } from '../models/Activity';
import { Notification } from '../models/Notification';
import type { IUser } from '../models/User';

function clientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/** Records an immutable security-relevant event (admin-only actions etc.). */
export async function audit(
  req: Request,
  opts: {
    actor?: IUser;
    actorName?: string;
    action: string;
    targetModel?: string;
    targetId?: Types.ObjectId | string;
    targetLabel?: string;
    result?: 'success' | 'failure';
    meta?: Record<string, any>;
  }
) {
  try {
    await AuditLog.create({
      actor: opts.actor?._id,
      actorName: opts.actorName ?? (opts.actor ? opts.actor.name : 'System'),
      action: opts.action,
      targetModel: opts.targetModel,
      targetId: opts.targetId,
      targetLabel: opts.targetLabel,
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) || '',
      result: opts.result ?? 'success',
      meta: opts.meta,
    });
  } catch (e) {
    console.error('[audit] failed to record', e);
  }
}

/** Adds an item to the collaborative activity feed. */
export async function logActivity(
  actor: IUser,
  action: IActivity['action'],
  entityType: IActivity['entityType'],
  opts: { entityId?: Types.ObjectId | string; project?: Types.ObjectId | string; meta?: Record<string, any> } = {}
) {
  try {
    await Activity.create({
      actor: actor._id,
      action,
      entityType,
      entityId: opts.entityId,
      project: opts.project,
      meta: opts.meta,
    });
  } catch (e) {
    console.error('[activity] failed to log', e);
  }
}

/** Pushes a notification to one or many users. */
export async function notify(
  userIds: (Types.ObjectId | string)[],
  payload: { type: 'task_assigned' | 'status_changed' | 'comment' | 'mention' | 'deadline' | 'project' | 'security'; title: string; message: string; link?: string },
  excludeId?: Types.ObjectId | string
) {
  try {
    const docs = userIds
      .filter((id) => String(id) !== String(excludeId ?? ''))
      .map((user) => ({ user, ...payload }));
    if (docs.length) await Notification.insertMany(docs);
  } catch (e) {
    console.error('[notify] failed', e);
  }
}

import type { Request, Response, NextFunction } from 'express';
import { User, type IUser } from '../models/User';
import { verifyToken } from '../utils/jwt';
import { HttpError } from '../utils/helpers';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const AUTH_COOKIE = 'ttm_token';

/** Extracts JWT from httpOnly cookie or Authorization header. */
function extractToken(req: Request): string | null {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Authentication middleware — always loads the user fresh from the database.
 * Role information sent by the client is never trusted.
 */
export async function protect(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new HttpError(401, 'Not authenticated. Please sign in.');

    const userId = verifyToken(token);
    if (!userId) throw new HttpError(401, 'Session expired or invalid. Please sign in again.');

    const user = await User.findById(userId);
    if (!user || !user.active) throw new HttpError(401, 'Account not found or deactivated.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return next(new HttpError(403, 'Forbidden — administrator access required.'));
  }
  next();
}

/** Team Lead or Admin */
export function requireTeamLead(req: AuthRequest, _res: Response, next: NextFunction) {
  const u = req.user;
  const isLead = u && (u.role === 'admin' || (u.role === 'member' && u.memberType === 'team_lead'));
  if (!isLead) {
    return next(new HttpError(403, 'Forbidden — team lead access required.'));
  }
  next();
}

/** Project membership / admin check used inside controllers. */
export function canAccessProject(user: IUser, project: { owner: any; members: any[] }): boolean {
  if (user.role === 'admin') return true;
  const uid = String(user._id);
  return (
    String(project.owner) === uid ||
    project.members.some((m) => String(m.user?._id ?? m.user) === uid)
  );
}

export function isTeamLeadOrAdmin(user?: IUser): boolean {
  return !!user && (user.role === 'admin' || user.memberType === 'team_lead');
}

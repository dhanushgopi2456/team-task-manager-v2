import crypto from 'crypto';
import type { Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { getSettings } from '../models/SystemSetting';
import { signToken, verifyToken } from '../utils/jwt';
import { AUTH_COOKIE, type AuthRequest } from '../middleware/auth';
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

function sendSession(res: Response, userId: string, remember: boolean) {
  const token = signToken(userId);
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: (remember ? 30 : 7) * 24 * 60 * 60 * 1000,
  });
  return token;
}

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(8).max(72),
});

/** Public registration always creates a REGULAR MEMBER. Roles are admin-controlled. */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = registerSchema.parse(req.body);
  const settings = await getSettings();
  if (!settings.allowRegistration) throw new HttpError(403, 'Registration is currently disabled by the administrator.');

  const existing = await User.findOne({ email: data.email });
  if (existing) throw new HttpError(409, 'An account with this email already exists.');

  const isFirstUser = (await User.countDocuments()) === 0;
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: isFirstUser ? 'admin' : 'member',
    memberType: isFirstUser ? null : settings.defaultMemberType,
    lastLogin: new Date(),
  });

  await audit(req, {
    actor: user,
    action: isFirstUser ? 'system_bootstrap_admin' : 'user_registered',
    targetModel: 'User',
    targetId: user._id as any,
    targetLabel: user.email,
  });
  await notify([user._id], {
    type: 'security',
    title: 'Welcome to Team Task Manager',
    message: `Your account was created. Smart Teamwork. Clear Tasks. Better Results.`,
    link: '/dashboard',
  });

  const token = sendSession(res, String(user._id), true);
  res.status(201).json({ success: true, token, user: publicUser(user) });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1), remember: z.boolean().optional() });
  const { email, password, remember } = schema.parse(req.body);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    await audit(req, { action: 'login_failed', result: 'failure', actorName: email || 'Unknown', meta: { email } });
    throw new HttpError(401, 'Invalid email or password.');
  }
  if (!user.active) throw new HttpError(403, 'This account has been deactivated. Contact your administrator.');

  // Session tracking
  const ua = (req.headers['user-agent'] as string) || 'Unknown device';
  user.sessions = [
    ...(user.sessions || []).filter((s) => s.userAgent !== ua),
    { id: crypto.randomUUID(), userAgent: ua.slice(0, 200), ip: req.socket.remoteAddress || '', createdAt: new Date() },
  ].slice(-8);
  user.lastLogin = new Date();
  await user.save();

  const token = sendSession(res, String(user._id), !!remember);
  await audit(req, { actor: user, action: 'login_success', targetModel: 'User', targetId: user._id as any, targetLabel: user.email });
  res.json({ success: true, token, user: publicUser(user) });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.clearCookie(AUTH_COOKIE);
  res.json({ success: true, message: 'Signed out' });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: publicUser(req.user!) });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);

  const user = await User.findOne({ email });
  let devResetLink: string | undefined;
  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    // In production this link would be emailed. Without SMTP configured the
    // link is surfaced to the client in non-production for demo purposes.
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
      devResetLink = `/reset-password?token=${raw}`;
    }
    console.log(`[auth] Password reset requested for ${email} → /reset-password?token=${raw}`);
    await audit(req, { actor: user, action: 'password_reset_requested', targetModel: 'User', targetId: user._id as any, targetLabel: email });
  }

  // Do not reveal whether the account exists.
  res.json({
    success: true,
    message: 'If an account with that email exists, a reset link has been generated.',
    devResetLink,
  });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(72) });
  const { token, password } = schema.parse(req.body);

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw new HttpError(400, 'Reset link is invalid or has expired.');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.sessions = []; // revoke all sessions
  await user.save();

  await notify([user._id], { type: 'security', title: 'Password changed', message: 'Your password was reset successfully.', link: '/settings' });
  await audit(req, { actor: user, action: 'password_reset_completed', targetModel: 'User', targetId: user._id as any, targetLabel: user.email });
  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(72), logoutOthers: z.boolean().optional() });
  const { currentPassword, newPassword, logoutOthers } = schema.parse(req.body);

  const user = await User.findById(req.user!._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new HttpError(401, 'Current password is incorrect.');
  }
  user.password = newPassword;
  if (logoutOthers) user.sessions = [];
  await user.save();

  await notify([user._id], { type: 'security', title: 'Password changed', message: 'Your password was updated.', link: '/settings' });
  await audit(req, { actor: user, action: 'password_changed', targetModel: 'User', targetId: user._id as any });
  res.json({ success: true, message: 'Password updated successfully' });
});

export const listSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, sessions: req.user!.sessions || [] });
});

export const revokeSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const keep = req.body?.sessionId;
  const user = req.user!;
  user.sessions = (user.sessions || []).filter((s) => s.id === keep);
  await user.save();
  await audit(req, { actor: user, action: 'sessions_revoked', targetModel: 'User', targetId: user._id as any });
  res.json({ success: true, message: 'Other sessions signed out', sessions: user.sessions });
});

import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { env } from '../config/env';

export function signToken(userId: Types.ObjectId | string): string {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string };
    return payload.sub || null;
  } catch {
    return null;
  }
}

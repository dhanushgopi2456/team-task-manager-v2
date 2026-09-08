import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'API route not found' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  let status = err?.status || err?.statusCode || 500;
  let message = err?.message || 'Internal server error';

  if (err instanceof ZodError) {
    status = 400;
    message = err.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
  }
  if (err?.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e: any) => e.message).join('; ');
  }
  if (err?.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier format';
  }
  if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ success: false, message });
}

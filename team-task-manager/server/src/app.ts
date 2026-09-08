import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import activityRoutes from './routes/activity.routes';
import coreRoutes from './routes/core.routes';
import { notFound, errorHandler } from './middleware/error';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '4mb' }));
  app.use(cookieParser());

  // Lightweight request log in dev
  if (!env.isProd) {
    app.use((req, _res, next) => {
      console.log(`[api] ${req.method} ${req.path}`);
      next();
    });
  }

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ success: true, name: 'Team Task Manager API', status: 'ok' }));
  api.use('/auth', authRoutes);
  api.use('/users', userRoutes);
  api.use('/projects', projectRoutes);
  api.use('/tasks', taskRoutes);
  api.use('/comments', commentRoutes);
  api.use('/notifications', notificationRoutes);
  api.use('/reports', reportRoutes);
  api.use('/admin', adminRoutes);
  api.use('/activity', activityRoutes);
  api.use('/', coreRoutes); // /profile/me + /teams

  app.use('/api', api);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env';
import { connectDB } from './config/db';

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

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: [
      env.clientUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

let startupPromise: Promise<void> | null = null;

async function startup(): Promise<void> {
  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    await connectDB();

    const { User } = await import('./models/User');

    if ((await User.countDocuments()) === 0) {
      const { seed } = await import('./seed/seed');
      await seed();
    }
  })();

  return startupPromise;
}

app.use(async (_req, _res, next) => {
  try {
    await startup();
    next();
  } catch (error) {
    next(error);
  }
});

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({
    success: true,
    name: 'Team Task Manager API',
    status: 'ok',
  });
});

api.use('/auth', authRoutes);
api.use('/users', userRoutes);
api.use('/projects', projectRoutes);
api.use('/tasks', taskRoutes);
api.use('/comments', commentRoutes);
api.use('/notifications', notificationRoutes);
api.use('/reports', reportRoutes);
api.use('/admin', adminRoutes);
api.use('/activity', activityRoutes);
api.use('/', coreRoutes);

app.use('/api', api);

app.use(notFound);
app.use(errorHandler);

export default app;

if (!env.isProd) {
  startup()
    .then(() => {
      app.listen(env.port, () => {
        console.log(
          `[server] API ready on http://localhost:${env.port}/api`
        );
      });
    })
    .catch((err) => {
      console.error('Fatal startup error:', err);
      process.exit(1);
    });
}
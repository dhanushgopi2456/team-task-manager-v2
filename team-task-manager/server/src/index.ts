import { env } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './application';

const app = createApp();

let startupPromise: Promise<void> | null = null;

async function startup(): Promise<void> {
  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   TEAM TASK MANAGER — API Server         ║');
    console.log('║   Smart Teamwork. Clear Tasks.           ║');
    console.log('╚══════════════════════════════════════════╝');

    await connectDB();

    // Seed automatically when the database is empty (fresh demo start).
    const { User } = await import('./models/User');

    if ((await User.countDocuments()) === 0) {
      console.log('[seed] Empty database detected — loading demo data…');

      const { seed } = await import('./seed/seed');

      await seed();
    }

    console.log('[server] Database initialization complete');
  })();

  return startupPromise;
}

/*
 * Vercel Serverless Function entry point.
 *
 * Vercel detects this default export and uses it to handle API requests.
 */
export default async function handler(req: any, res: any) {
  await startup();

  return app(req, res);
}

/*
 * Local development.
 *
 * When NODE_ENV is not production, run the normal Express server
 * on the configured local port.
 */
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
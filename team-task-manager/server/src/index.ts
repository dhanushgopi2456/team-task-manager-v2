import { env } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TEAM TASK MANAGER — API Server         ║');
  console.log('║   Smart Teamwork. Clear Tasks.           ║');
  console.log('╚══════════════════════════════════════════╝');

  await connectDB();

  // Seed automatically when the database is empty (fresh demo start).
  const { Task } = await import('./models/Task');
  const { User } = await import('./models/User');
  if ((await User.countDocuments()) === 0) {
    console.log('[seed] Empty database detected — loading demo data…');
    const { seed } = await import('./seed/seed');
    await seed();
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] API ready on http://localhost:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

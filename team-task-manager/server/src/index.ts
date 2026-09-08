import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

/*
 * Local development only.
 *
 * Vercel uses the default export from src/app.ts directly,
 * so this file does not start a server in production.
 */
if (!env.isProd) {
  app.listen(env.port, () => {
    console.log(
      `[server] API ready on http://localhost:${env.port}/api`
    );
  });
}
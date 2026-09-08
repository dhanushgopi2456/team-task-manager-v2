import express from 'express';
import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

// Keep a direct Express import in this Vercel entrypoint.
// Vercel uses this file to detect the Express application.
void express;

/*
 * Vercel uses the default export.
 */
export default app;

/*
 * Local development only.
 */
if (!env.isProd) {
  app.listen(env.port, () => {
    console.log(
      `[server] API ready on http://localhost:${env.port}/api`
    );
  });
}
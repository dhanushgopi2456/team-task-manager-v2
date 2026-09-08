import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Connects to MongoDB. If MONGO_URI is not provided (or unreachable) outside
 * production, an ephemeral in-memory instance keeps the demo usable instantly.
 */
export async function connectDB(): Promise<void> {
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri, { dbName: env.dbName });
      console.log(`[db] MongoDB connected → ${mongoose.connection.host}/${env.dbName}`);
      return;
    } catch (err) {
      console.error('[db] Failed to connect to MONGO_URI:', err);
      if (env.isProd) throw err;
      console.warn('[db] Falling back to in-memory demo database…');
    }
  } else if (env.isProd) {
    throw new Error('MONGO_URI is required in production');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  const uri = mem.getUri();
  await mongoose.connect(uri + env.dbName);
  console.log(`[db] In-memory MongoDB ready at ${uri}${env.dbName}`);
  (global as any).__ttmMemServer = mem;
}

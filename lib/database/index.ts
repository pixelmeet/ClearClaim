import { DatabaseAdapter } from '@/types/database';

let cachedDbAdapter: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (cachedDbAdapter) {
    return cachedDbAdapter;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in environment configuration.');
  }

  cachedDbAdapter = (await import('./mongodb')).MongoDbAdapter;
  return cachedDbAdapter;
}
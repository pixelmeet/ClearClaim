import { DatabaseAdapter } from '@/types/database';

let cachedDbAdapter: DatabaseAdapter | null = null;

/**
 * Dynamically loads and returns the configured database adapter.
 * Caches the adapter for subsequent calls.
 */
export async function getDb(): Promise<DatabaseAdapter> {
  if (cachedDbAdapter) {
    return cachedDbAdapter;
  }

  let provider = process.env.DATABASE_PROVIDER;

  // Fallback: If no provider is set, but MONGODB_URI is present, default to mongodb.
  if (!provider && process.env.MONGODB_URI) {
    provider = 'mongodb';
  }

  switch (provider) {
    case 'supabase':
      cachedDbAdapter = (await import('./supabase')).SupabaseAdapter;
      break;
    case 'mongodb':
      cachedDbAdapter = (await import('./mongodb')).MongoDbAdapter;
      break;
    case 'firebase':
      cachedDbAdapter = (await import('./firebase')).FirebaseAdapter;
      break;
    default:
      throw new Error(`Unsupported or missing database provider: ${provider}. Please set DATABASE_PROVIDER in .env to "supabase", "mongodb", or "firebase", or ensure MONGODB_URI is set.`);
  }

  return cachedDbAdapter;
}
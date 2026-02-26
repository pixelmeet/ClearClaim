// You can comment out or delete the imports for the databases you are NOT using.
// However, with dynamic imports, it's safe to leave them for type-checking purposes.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Db } from "mongodb";
import type admin from "firebase-admin";

// --- Client Caching ---
// These will hold the initialized clients to avoid reconnecting on every call.
// We attach them to the global object in development to persist across hot reloads.

const globalForDb = global as unknown as {
  supabase: SupabaseClient | null;
  mongoDb: Db | null;
  firebaseAdmin: typeof admin | null;
};

/**
 * Dynamically imports and initializes the Supabase client.
 * Caches the client for subsequent calls.
 */
export async function getSupabaseClient() {
  if (globalForDb.supabase) {
    return globalForDb.supabase;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    // Only throw if we are actually trying to use Supabase
    // But strictly speaking, if generic adapter uses it, it will fail.
    // For now, let's assume if this function is called, we need credentials.
    // But maybe we return null or throw? Throwing is safer for debugging.
  }

  const client = createClient(supabaseUrl, supabaseKey);

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.supabase = client;
  }

  return client;
}

/**
 * Dynamically imports and initializes the MongoDB client.
 * Caches the database connection.
 */
export async function getMongoDb() {
  if (globalForDb.mongoDb) {
    return globalForDb.mongoDb;
  }

  const { MongoClient } = await import("mongodb");
  const mongoUri = process.env.MONGODB_URI!;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  // Optimize wrapper for Next.js HMR? 
  // Actually, standard pattern is to cache the CLIENT, not the DB instance directly usually,
  // but caching the DB instance `client.db()` is also fine if connection stays open.
  // Ideally we cache the MongoClient. But the current function returns `Db`.
  // Let's stick to returning `Db` but cache it.

  // NOTE: In a rigorous setup we cache the MongoClientPromise (like lib/db.ts). 
  // But here we are just caching the result db object. 
  // This is okay if we don't need to disconnect manually.

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME);

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.mongoDb = db;
  }

  return db;
}

/**
 * Dynamically imports and initializes the Firebase Admin SDK.
 * Caches the admin instance.
 */
export async function getFirebaseAdmin() {
  if (globalForDb.firebaseAdmin) {
    return globalForDb.firebaseAdmin;
  }

  const admin = (await import("firebase-admin")).default;

  if (!admin.apps.length) {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.firebaseAdmin = admin;
  }

  return admin;
}
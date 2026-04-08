import type { Db } from "mongodb";

const globalForDb = global as unknown as {
  mongoDb: Db | null;
};

export async function getMongoDb() {
  if (globalForDb.mongoDb) {
    return globalForDb.mongoDb;
  }

  const { MongoClient } = await import("mongodb");
  const mongoUri = process.env.MONGODB_URI!;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME);

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.mongoDb = db;
  }

  return db;
}
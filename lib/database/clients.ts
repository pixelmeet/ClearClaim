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
  // Atlas works with either an explicit DB name env var or the DB embedded in the URI.
  const dbName = process.env.MONGODB_DB_NAME?.trim();
  const db = dbName ? client.db(dbName) : client.db();

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.mongoDb = db;
  }

  return db;
}
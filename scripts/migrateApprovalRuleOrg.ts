import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName: dbName,
  });

  const col = mongoose.connection.db.collection('approvalrules');
  const rules = await col.find({}).toArray();

  let migrated = 0;
  for (const rule of rules) {
    if (typeof rule.organization === 'string') {
      try {
        await col.updateOne(
          { _id: rule._id },
          { $set: { organization: new mongoose.Types.ObjectId(rule.organization) } }
        );
        migrated++;
      } catch (e) {
        console.error(`Failed to migrate rule ${rule._id}:`, e);
      }
    }
  }

  console.log(`Migrated ${migrated} / ${rules.length} ApprovalRule documents`);
  await mongoose.disconnect();
}

migrate().catch(console.error);

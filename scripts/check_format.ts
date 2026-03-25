import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import User from '../models/User';

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to DB');
    
    const usersWithManager = await User.find({ managerId: { $exists: true, $ne: null } }).lean();
    console.log('Users with manager:', JSON.stringify(usersWithManager, null, 2));
    
    if (usersWithManager.length > 0) {
        const mgrId = usersWithManager[0].managerId;
        console.log('Type of managerId:', typeof mgrId);
        console.log('Is instance of ObjectId:', mgrId instanceof mongoose.Types.ObjectId);
    } else {
        console.log('No users found with a manager assigned.');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();

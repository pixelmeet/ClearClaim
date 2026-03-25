import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to DB');

    const admin = await User.findOne({ role: 'admin' });
    const fakeAdminObjectId = new mongoose.Types.ObjectId();
    const newUserRole = 'moderator'; // Manager
    
    const newUser = {
      id: uuidv4(),
      fullName: 'Test Manager',
      email: `testmgr_${Date.now()}@example.com`,
      role: newUserRole,
      passwordHash: 'fakehash',
      companyId: admin?.companyId || new mongoose.Types.ObjectId(),
      // Simulation of the new logic:
      ...(newUserRole === 'moderator' ? { managerId: admin?._id || fakeAdminObjectId } : {})
    };

    console.log('New user object to be created:', newUser);
    
    const userDoc = new User(newUser);
    console.log('Mongoose doc managerId:', userDoc.managerId);
    
    const expectedId = admin?._id || fakeAdminObjectId;
    if (userDoc.managerId?.toString() === expectedId.toString()) {
        console.log('VERIFICATION SUCCESS: managerId correctly assigned as ObjectId.');
    } else {
        console.log('VERIFICATION FAILED: managerId mismatch.');
        console.log('Expected:', expectedId.toString());
        console.log('Got:', userDoc.managerId?.toString());
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

verify();

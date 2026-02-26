import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        // Find users managed by me in this company
        const teamMembers = await User.find({
            managerId: session.userId,
            companyId: session.companyId
        }).select('_id');
        const teamIds = teamMembers.map(u => u._id);

        const expenses = await Expense.find({ employeeId: { $in: teamIds } })
            .populate('employeeId', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json({ expenses });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

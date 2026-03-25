import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        // Find users managed by me in this company
        const teamMembers = await User.find({
            managerId: session.userId,
            companyId: session.companyId
        }).select('_id');
        const teamIds = teamMembers.map(u => u._id);

        const filter = { employeeId: { $in: teamIds }, companyId: session.companyId };

        const total = await Expense.countDocuments(filter);

        const paginated = await Expense.find(filter)
            .populate('employeeId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            expenses: paginated,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

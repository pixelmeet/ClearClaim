import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { canUserActOnExpense, getApprovalFlow } from '@/lib/approvalEngine'; // Alias for compatibility or just rename usage
import { getSession } from '@/lib/auth';
import { ExpenseStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = await User.findOne({ _id: session.userId, companyId: session.companyId });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {
            companyId: session.companyId,
            status: { $in: [ExpenseStatus.PENDING, ExpenseStatus.SUBMITTED] },
        };

        const category = searchParams.get('category');
        if (category) filter.category = category;

        const search = searchParams.get('search');
        if (search) filter.description = { $regex: search, $options: 'i' };

        const candidates = await Expense.find(filter)
            .populate('employeeId', 'name email managerId')
            .sort({ createdAt: -1 });

        const pending = [];
        const flowCache = new Map<string, any>();
        for (const expense of candidates) {
            const key = expense.category ? String(expense.category) : '__default__';
            let flow = flowCache.get(key);
            if (!flow) {
                flow = await getApprovalFlow(session.companyId.toString(), expense);
                flowCache.set(key, flow);
            }

            const canAct = await canUserActOnExpense(user, expense, flow);
            if (canAct) {
                pending.push(expense);
            }
        }

        const total = pending.length;
        const paginated = pending.slice(skip, skip + limit);

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
    } catch (error) {
        console.error('Pending fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

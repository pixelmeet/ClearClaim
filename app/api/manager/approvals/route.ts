import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { canUserActOnExpense } from '@/lib/approvalEngine'; // Alias for compatibility or just rename usage
import { getSession } from '@/lib/auth';
import { ExpenseStatus } from '@/lib/types';
import ApprovalFlow from '@/models/ApprovalFlow';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = await User.findById(session.userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Fetch ALL pending expenses for company (inefficient for large scale, but simple for demo)
        // Then filter in memory using `canUserActOnExpense`.
        // Optimization: filtering by companyId and Status=PENDING/SUBMITTED first.
        const candidates = await Expense.find({
            companyId: session.companyId,
            status: { $in: [ExpenseStatus.PENDING, ExpenseStatus.SUBMITTED] }
        }).populate('employeeId', 'name email');

        // Fetch flow once (might not exist if they only use rules)
        const flow = await ApprovalFlow.findOne({ companyId: session.companyId });

        const pending = [];
        for (const expense of candidates) {
            // Filter: Can I approve this?
            const canAct = await canUserActOnExpense(user, expense, flow);
            if (canAct) {
                pending.push(expense);
            }
        }

        return NextResponse.json({ expenses: pending });
    } catch (error) {
        console.error('Pending fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { applyApprovalAction } from '@/lib/approvalEngine';
import { getSession } from '@/lib/auth';
import { ProcessApprovalSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const result = ProcessApprovalSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { expenseId, action, comment } = result.data;

        await connectToDatabase();

        const user = await User.findById(session.userId);
        const expense = await Expense.findById(expenseId);

        if (!user || !expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const newStatus = await applyApprovalAction(expense, user, action, comment || '');

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error('Approval Action error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

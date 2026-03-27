import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { applyApprovalAction, canUserActOnExpense, getApprovalFlow } from '@/lib/approvalEngine';
import { getSession } from '@/lib/auth';
import { ProcessApprovalSchema } from '@/lib/validation';
import { UserRole } from '@/lib/types';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = rateLimit(`approval-action:${session.userId}`, 30, 60_000);
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
                }
            );
        }

        const body = await req.json();
        const result = ProcessApprovalSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { expenseId, action, comment } = result.data;

        await connectToDatabase();

        const user = await User.findOne({ _id: session.userId, companyId: session.companyId });
        const expense = await Expense.findOne({ _id: expenseId, companyId: session.companyId });

        if (!user || !expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const allowed = await canUserActOnExpense(user, expense);
        if (!allowed) {
            return NextResponse.json(
                { error: 'You are not the current approver for this expense' },
                { status: 403 }
            );
        }

        const newStatus = await applyApprovalAction(expense, user, action, comment || '');

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error('Approval Action error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

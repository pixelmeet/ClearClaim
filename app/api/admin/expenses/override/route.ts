import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import ApprovalAction from '@/models/ApprovalAction';
import { getSession } from '@/lib/auth';
import { OverrideApprovalSchema } from '@/lib/validation';
import { UserRole, ActionType, ExpenseStatus } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = OverrideApprovalSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { expenseId, action, comment } = result.data;

        await connectToDatabase();

        const expense = await Expense.findOne({ _id: expenseId, companyId: session.companyId });
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Apply override
        const status = action === ActionType.OVERRIDE_APPROVE ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED;

        expense.status = status;
        await expense.save();

        // Log Action
        await ApprovalAction.create({
            expenseId,
            companyId: session.companyId,
            stepIndex: expense.currentStepIndex, // Current step when override happened
            approverId: session.userId,
            action,
            comment,
        });

        return NextResponse.json({ success: true, expense });

    } catch (error) {
        console.error('Override error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

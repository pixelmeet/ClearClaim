import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import ApprovalAction from '@/models/ApprovalAction';
import { getSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const { id } = await params;

        const expense = await Expense.findById(id)
            .populate('employeeId', 'name email')
            .populate('companyId', 'name defaultCurrency');

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Check access: employee can only see own expenses
        if (expense.employeeId.toString() !== session.userId && session.role !== 'ADMIN' && session.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch approval timeline
        const actions = await ApprovalAction.find({ expenseId: id })
            .populate('approverId', 'name email role')
            .sort({ createdAt: 1 });

        return NextResponse.json({ expense, timeline: actions });
    } catch (error) {
        console.error('Get expense error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

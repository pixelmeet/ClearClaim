import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import ApprovalAction from '@/models/ApprovalAction';
import { getSession } from '@/lib/auth';
import { ExpenseStatus, UserRole } from '@/lib/types';
import { UpdateExpenseSchema } from '@/lib/validation';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const { id } = await params;

        const expense = await Expense.findOne({ _id: id, companyId: session.companyId })
            .populate('employeeId', 'name email')
            .populate('companyId', 'name defaultCurrency');

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Check access: employee can only see own expenses
        const isOwner = expense.employeeId.toString() === session.userId;
        const isPrivileged = session.role === UserRole.ADMIN || session.role === UserRole.MANAGER;
        if (!isOwner && !isPrivileged) {
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

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const { id } = await params;

        const expense = await Expense.findOne({
            _id: id,
            companyId: session.companyId,
            employeeId: session.userId,
        });

        if (!expense) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const editableStatuses = [ExpenseStatus.DRAFT, ExpenseStatus.SUBMITTED];
        if (!editableStatuses.includes(expense.status as any)) {
            return NextResponse.json(
                { error: 'Expense cannot be edited once approval has started' },
                { status: 409 }
            );
        }

        const body = await req.json();
        const result = UpdateExpenseSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        Object.assign(expense, result.data);
        await expense.save();

        return NextResponse.json({ expense });
    } catch (error) {
        console.error('Patch expense error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

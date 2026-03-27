import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense, { ExpenseStatus } from '@/models/Expense';
import User, { UserRole } from '@/models/User';
import ApprovalAction, { ActionType } from '@/models/ApprovalAction';
import { getSession } from '@/lib/auth';
import { sendExpenseStatusEmail } from '@/lib/notifications/email';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { expenseId, action, comment } = await req.json();

        if (!expenseId || !action || !comment || comment.length < 5) {
            return NextResponse.json({ error: 'Expense ID, action, and valid comment (min 5 chars) required' }, { status: 400 });
        }

        await connectToDatabase();

        const expense = await Expense.findOne({ _id: expenseId, companyId: session.companyId });
        if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

        // Force transition
        const newStatus = action === 'APPROVE' ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED;
        expense.status = newStatus;
        
        // Audit log for the override
        await ApprovalAction.create({
            expenseId: expense._id,
            companyId: expense.companyId,
            approverId: session.userId,
            action: action === 'APPROVE' ? ActionType.APPROVE : ActionType.REJECT,
            comment: `[ADMIN OVERRIDE] ${comment}`,
            stepIndex: expense.currentStepIndex
        });

        await expense.save();

        // Notify submitter
        try {
            const employee = await User.findById(expense.employeeId).select('name email');
            if (employee?.email) {
                await sendExpenseStatusEmail({
                    to: employee.email,
                    employeeName: employee.name,
                    status: newStatus,
                    amount: expense.amountOriginal,
                    currency: expense.currencyOriginal,
                    comment: `Admin has manually ${action.toLowerCase()}ed this expense.`
                });
            }
        } catch (e) {
            console.error('Email notification failed:', e);
        }

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error('Admin Override error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import ApprovalAction from '@/models/ApprovalAction';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch all for company, populate employee
        const expensesDocs = await Expense.find({ companyId: session.companyId })
            .populate('employeeId', 'name email')
            .sort({ createdAt: -1 });

        const expenses = expensesDocs.map(doc => doc.toObject());

        const expenseIds = expenses.map(e => e._id);
        const autoApproveActions = await ApprovalAction.find({
            expenseId: { $in: expenseIds },
            comment: '[AUTO-APPROVED BY RULE]'
        }).select('expenseId').lean();

        const autoApprovedIds = new Set(autoApproveActions.map(a => a.expenseId.toString()));

        const enrichedExpenses = expenses.map(e => ({
            ...e,
            isAutoApproved: autoApprovedIds.has(e._id.toString())
        }));

        return NextResponse.json({ expenses: enrichedExpenses });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

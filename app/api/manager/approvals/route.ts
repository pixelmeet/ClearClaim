import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { canUserActOnExpense } from '@/lib/approvalEngine';
import { getSession } from '@/lib/auth';
import { ExpenseStatus, UserRole } from '@/lib/types';
import mongoose from 'mongoose';
import { paginationMeta, parsePagination } from '@/lib/pagination';

function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = await User.findOne({ _id: session.userId, companyId: session.companyId });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, any> = {
            companyId: session.companyId,
            status: { $in: [ExpenseStatus.PENDING, ExpenseStatus.SUBMITTED] },
        };

        const category = searchParams.get('category');
        if (category) filter.category = category;

        const search = searchParams.get('search');
        if (search) filter.description = { $regex: escapeRegex(search), $options: 'i' };

        if (session.role !== UserRole.ADMIN) {
            filter.$or = [
                { currentApproverId: new mongoose.Types.ObjectId(session.userId) },
                { 'resolvedChain.approverId': session.userId },
            ];
        }

        const [candidates, total] = await Promise.all([
            Expense.find(filter)
                .populate('employeeId', 'name email managerId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Expense.countDocuments(filter),
        ]);

        const paginated = session.role === UserRole.ADMIN
            ? candidates
            : candidates.filter((expense) => canUserActOnExpense(user, expense));

        return NextResponse.json({
            expenses: paginated,
            pagination: paginationMeta(page, limit, total),
        });
    } catch (error) {
        console.error('Pending fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

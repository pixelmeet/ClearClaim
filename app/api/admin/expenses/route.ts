import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = { companyId: session.companyId };

        const status = searchParams.get('status');
        if (status) filter.status = status;

        const category = searchParams.get('category');
        if (category) filter.category = category;

        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        if (dateFrom || dateTo) {
            filter.expenseDate = {};
            if (dateFrom) filter.expenseDate.$gte = new Date(dateFrom);
            if (dateTo) filter.expenseDate.$lte = new Date(dateTo);
        }

        const amountMin = searchParams.get('amountMin');
        const amountMax = searchParams.get('amountMax');
        if (amountMin || amountMax) {
            filter.amountOriginal = {};
            if (amountMin) filter.amountOriginal.$gte = Number(amountMin);
            if (amountMax) filter.amountOriginal.$lte = Number(amountMax);
        }

        const search = searchParams.get('search');
        if (search) filter.description = { $regex: search, $options: 'i' };

        const total = await Expense.countDocuments(filter);

        const paginated = await Expense.find(filter)
            .populate('employeeId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

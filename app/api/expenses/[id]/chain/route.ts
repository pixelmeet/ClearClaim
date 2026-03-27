import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const expenseId = id;
        await connectToDatabase();

        const expense = await Expense.findOne({ _id: expenseId, companyId: session.companyId });
        if (!expense) return NextResponse.json({ error: 'NotFound' }, { status: 404 });

        return NextResponse.json(expense.resolvedChain || []);

    } catch (error) {
        console.error('Chain snapshot error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

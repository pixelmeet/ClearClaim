import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSession } from '@/lib/auth';
import Expense from '@/models/Expense';
import ApprovalAction from '@/models/ApprovalAction';

export async function GET(
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
    });
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const actions = await ApprovalAction.find({ expenseId: id })
      .populate('approverId', 'name email role')
      .sort({ createdAt: 1 });

    return NextResponse.json({ actions });
  } catch (e) {
    console.error('Fetch expense actions error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


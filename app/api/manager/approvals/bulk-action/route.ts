import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { rateLimit } from '@/lib/rateLimit';
import User from '@/models/User';
import Expense from '@/models/Expense';
import { applyApprovalAction, canUserActOnExpense } from '@/lib/approvalEngine';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = rateLimit(`approvals-bulk:${session.userId}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const { expenseIds, action, comment } = body ?? {};

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json(
        { error: 'expenseIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (expenseIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 expenses per bulk action' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ _id: session.userId, companyId: session.companyId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of expenseIds) {
      try {
        const expense = await Expense.findOne({ _id: id, companyId: session.companyId });
        if (!expense) {
          results.push({ id, success: false, error: 'Not found' });
          continue;
        }

        // canUserActOnExpense reads from resolvedChain — no flow lookup needed
        const allowed = canUserActOnExpense(user, expense);
        if (!allowed && session.role !== UserRole.ADMIN) {
          results.push({ id, success: false, error: 'Not authorized for this expense' });
          continue;
        }

        await applyApprovalAction(expense, user, action, comment ?? '');
        results.push({ id, success: true });
      } catch (e: any) {
        results.push({ id, success: false, error: e?.message || 'Unknown error' });
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error('Bulk approvals error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

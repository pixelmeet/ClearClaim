import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { rateLimit } from '@/lib/rateLimit';
import User from '@/models/User';
import Expense from '@/models/Expense';
import { applyApprovalAction, canUserActOnExpense } from '@/lib/approvalEngine';
import { z } from 'zod';
import { ActionType } from '@/lib/types';

const BulkActionSchema = z.object({
  expenseIds: z.array(z.string().min(24)).min(1).max(50),
  action: z.enum([ActionType.APPROVE, ActionType.REJECT]),
  comment: z.string().max(1000).optional(),
});

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
    const parsed = BulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { expenseIds, action, comment } = parsed.data;

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

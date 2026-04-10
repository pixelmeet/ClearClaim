import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import { getSession } from '@/lib/auth';
import Expense from '@/models/Expense';
import { ExpenseStatus } from '@/lib/types';

type MonthlyRow = { _id: { year: number; month: number }; amount: number };
type CategoryRow = { _id: string; amount: number };

const pendingStatuses = [ExpenseStatus.PENDING, ExpenseStatus.SUBMITTED];

function monthLabel(year: number, month1to12: number) {
  // Use a stable UTC date to avoid TZ drift.
  const d = new Date(Date.UTC(year, month1to12 - 1, 1));
  return d.toLocaleString('en-US', { month: 'short' });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const companyOid = new mongoose.Types.ObjectId(session.companyId);
    const employeeOid = new mongoose.Types.ObjectId(session.userId);

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    start.setUTCMonth(start.getUTCMonth() - 11); // last 12 months incl current

    const [row] = await Expense.aggregate<{
      totals: Array<{ totalExpenses: number; approved: number; pending: number; companyCurrency: string }>;
      monthly: MonthlyRow[];
      category: CategoryRow[];
    }>([
      {
        $match: {
          companyId: companyOid,
          employeeId: employeeOid,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalExpenses: { $sum: '$amountCompany' },
                approved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', ExpenseStatus.APPROVED] }, '$amountCompany', 0],
                  },
                },
                pending: {
                  $sum: {
                    $cond: [{ $in: ['$status', pendingStatuses] }, '$amountCompany', 0],
                  },
                },
                companyCurrency: { $first: '$companyCurrency' },
              },
            },
          ],
          monthly: [
            { $match: { expenseDate: { $gte: start, $lte: now } } },
            {
              $group: {
                _id: {
                  year: { $year: '$expenseDate' },
                  month: { $month: '$expenseDate' },
                },
                amount: { $sum: '$amountCompany' },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
          category: [
            {
              $group: {
                _id: '$category',
                amount: { $sum: '$amountCompany' },
              },
            },
            { $sort: { amount: -1 } },
          ],
        },
      },
    ]);

    const totals = row?.totals?.[0] ?? {
      totalExpenses: 0,
      approved: 0,
      pending: 0,
      companyCurrency: 'INR',
    };

    const monthlyMap = new Map<string, number>();
    for (const m of row?.monthly ?? []) {
      const key = `${m._id.year}-${String(m._id.month).padStart(2, '0')}`;
      monthlyMap.set(key, m.amount);
    }

    // Fill missing months (smooth charts)
    const monthlyData: Array<{ month: string; amount: number }> = [];
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    for (let i = 0; i < 12; i++) {
      const y = cursor.getUTCFullYear();
      const m = cursor.getUTCMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      monthlyData.push({ month: monthLabel(y, m), amount: Number(monthlyMap.get(key) ?? 0) });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    const categoryData = (row?.category ?? []).map((c) => ({
      category: c._id,
      amount: Number(c.amount),
    }));

    const recentExpenses = await Expense.find(
      { companyId: companyOid, employeeId: employeeOid },
      { amountCompany: 1, companyCurrency: 1, status: 1, createdAt: 1, description: 1, isAutoApproved: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activities = recentExpenses.map((e) => ({
      id: String(e._id),
      status: e.status,
      amount: Number(e.amountCompany ?? 0),
      currency: e.companyCurrency ?? totals.companyCurrency ?? 'INR',
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : new Date(e.createdAt as any).toISOString(),
      description: e.description ?? '',
      isAutoApproved: Boolean(e.isAutoApproved),
      user: session.name ?? 'You',
    }));

    return NextResponse.json({
      // preferred (frontend) keys
      total: Number(totals.totalExpenses ?? 0),
      approved: Number(totals.approved ?? 0),
      pending: Number(totals.pending ?? 0),
      companyCurrency: totals.companyCurrency ?? 'INR',
      monthlyData,
      categoryData,
      activities,

      // backwards-compatible aliases
      totalExpenses: Number(totals.totalExpenses ?? 0),
    });
  } catch (error) {
    console.error('GET /api/dashboard/employee error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


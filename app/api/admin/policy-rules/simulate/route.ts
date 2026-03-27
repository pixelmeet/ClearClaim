import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { selectRule } from '@/lib/ruleEngine';
import { UserRole } from '@/lib/types';

// Body: { employeeId, amount, category, currency }
// Returns: which rule would fire and what the chain would look like
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== UserRole.ADMIN)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const { employeeId, amount, category, currency } = await req.json();

  const employee = await User.findOne({ _id: employeeId, companyId: session.companyId });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  // Build a fake expense object for simulation (not saved to DB)
  const fakeExpense: any = {
    _id:              'preview',
    companyId:        session.companyId,
    employeeId:       employee._id,
    amountOriginal:   amount,
    amountCompany:    amount,
    currencyOriginal: currency ?? 'INR',
    category:         category ?? null,
    resolvedChain:    [],
  };

  try {
    const result = await selectRule(fakeExpense, employee);

    // Enrich chain with approver names for display
    const enrichedChain = await Promise.all(
      result.chain.map(async (step) => {
        let approverName = null;
        if (step.approverId) {
          const approver = await User.findById(step.approverId).select('name email role');
          approverName = approver?.name ?? null;
        }
        return { ...step, approverName };
      })
    );

    return NextResponse.json({
      matched:     result.matched,
      blocked:     result.blocked,
      ruleId:      result.ruleId,
      ruleName:    result.ruleName,
      autoApprove: result.autoApprove,
      chain:       enrichedChain,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

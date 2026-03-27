import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import PolicyRule from '@/models/PolicyRule';
import { UserRole } from '@/lib/types';

// Body: { order: [{ id: string, priority: number }] }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== UserRole.ADMIN)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const { order } = await req.json();
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order must be array' }, { status: 400 });

  // Bulk update priorities
  await Promise.all(
    order.map(({ id, priority }: { id: string; priority: number }) =>
      PolicyRule.updateOne(
        { _id: id, companyId: session.companyId }, // tenant scoped
        { $set: { priority } }
      )
    )
  );

  return NextResponse.json({ success: true });
}

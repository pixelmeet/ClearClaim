import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import PolicyRule from '@/models/PolicyRule';
import { UserRole } from '@/lib/types';

async function getRule(id: string, companyId: string) {
  return PolicyRule.findOne({ _id: id, companyId });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { id } = await params;
  const rule = await getRule(id, session.companyId);
  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ rule });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== UserRole.ADMIN)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const rule = await getRule(id, session.companyId);
  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // If setting as default, unset others first
  if (body.isDefault === true) {
    await PolicyRule.updateMany(
      { companyId: session.companyId, isDefault: true, _id: { $ne: rule._id } },
      { $set: { isDefault: false } }
    );
  }

  Object.assign(rule, body);
  rule.companyId = session.companyId; // never allow tenant change
  await rule.save();

  return NextResponse.json({ rule });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== UserRole.ADMIN)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const rule = await getRule(id, session.companyId);
  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await rule.deleteOne();
  return NextResponse.json({ success: true });
}

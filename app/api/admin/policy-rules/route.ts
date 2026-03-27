import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import PolicyRule from '@/models/PolicyRule';
import { UserRole } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== UserRole.ADMIN)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const rules = await PolicyRule.find({ companyId: session.companyId })
    .sort({ priority: 1, createdAt: 1 });

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== UserRole.ADMIN)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const body = await req.json();

  // Validate required fields
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!Array.isArray(body.steps) || body.steps.length === 0) {
    if (!body.isDefault || body.fallbackBehavior !== 'AUTO_APPROVE') {
      return NextResponse.json({ error: 'steps array is required (or set as default auto-approve)' }, { status: 400 });
    }
  }

  // If setting this as default, unset any existing default
  if (body.isDefault) {
    await PolicyRule.updateMany(
      { companyId: session.companyId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const rule = await PolicyRule.create({
    ...body,
    companyId: session.companyId, // always force to current tenant
  });

  return NextResponse.json({ rule }, { status: 201 });
}

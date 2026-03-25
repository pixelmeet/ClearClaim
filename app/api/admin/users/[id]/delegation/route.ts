import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import User from '@/models/User';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { delegatedTo, delegationExpiresAt } = body ?? {};

    await connectToDatabase();

    // Ensure target user belongs to this company
    const target = await User.findOne({ _id: id, companyId: session.companyId });
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (delegatedTo === null || delegatedTo === '' || delegatedTo === 'none') {
      target.delegatedTo = null as any;
      target.delegationExpiresAt = null as any;
    } else {
      const delegate = await User.findOne({ _id: delegatedTo, companyId: session.companyId });
      if (!delegate) {
        return NextResponse.json({ error: 'Invalid delegatedTo user' }, { status: 400 });
      }
      target.delegatedTo = delegate._id as any;
      target.delegationExpiresAt = delegationExpiresAt ? new Date(delegationExpiresAt) : null;
    }

    await target.save();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Update delegation error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


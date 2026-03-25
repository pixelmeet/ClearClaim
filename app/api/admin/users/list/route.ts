import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';

/**
 * GET /api/admin/users/list
 * Lightweight user list for step builder dropdowns.
 * Returns only active users from the same company.
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const users = await User.find({
            companyId: session.companyId,
            isDisabled: false,
        })
            .select('_id name email role')
            .sort({ name: 1 });

        return NextResponse.json({ users });
    } catch (err: unknown) {
        console.error('[GET /api/admin/users/list]', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

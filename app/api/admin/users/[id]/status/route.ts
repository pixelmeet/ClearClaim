import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { z } from 'zod';

const ToggleStatusSchema = z.object({
    isDisabled: z.boolean()
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params in Next 15+ 
        const { id } = await params;

        if (id === session.userId) {
            return NextResponse.json({ error: 'Cannot disable your own admin account' }, { status: 400 });
        }

        const body = await req.json();
        const result = ToggleStatusSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        await connectToDatabase();

        const updatedUser = await User.findOneAndUpdate(
            { _id: id, companyId: session.companyId },
            { $set: { isDisabled: result.data.isDisabled } },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Toggle user status error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

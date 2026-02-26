import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { AdminUpdateUserSchema } from '@/lib/validation';

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

        const body = await req.json();
        const result = AdminUpdateUserSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        await connectToDatabase();

        const targetUser = await User.findOne({ _id: id, companyId: session.companyId });
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updates = { ...result.data };

        // Enforce role+manager assignment rules
        if (updates.role) {
            if (updates.role === UserRole.MANAGER || updates.role === UserRole.ADMIN) {
                updates.managerId = null; // Managers don't have managers in this app
            } else if (updates.role === UserRole.EMPLOYEE && updates.managerId && updates.managerId !== 'none') {
                // Ensure the assigned manager exists, is a MANAGER/ADMIN, and belongs to the same company
                const manager = await User.findOne({
                    _id: updates.managerId,
                    companyId: session.companyId,
                    role: { $in: [UserRole.MANAGER, UserRole.ADMIN] }
                });

                if (!manager) {
                    return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
                }
            }
        }

        // Handle "none" sentinel value for clearing manager
        if (updates.managerId === 'none' || updates.managerId === '') {
            updates.managerId = null;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
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

        // Prevent self-deletion
        if (id === session.userId) {
            return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
        }

        await connectToDatabase();

        const targetUser = await User.findOneAndDelete({ _id: id, companyId: session.companyId });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

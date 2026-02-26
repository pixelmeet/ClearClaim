import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import { getSession } from '@/lib/auth';
import { CreateUserSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch all users for this company
        const users = await User.find({ companyId: session.companyId })
            .select('-passwordHash') // sensitive
            .populate('managerId', 'name email'); // Populate manager details

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = CreateUserSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { name, email, role, managerId, password } = result.data;

        await connectToDatabase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // Default password if not provided (demo mode: 'password123')
        const finalPassword = password || 'password123';
        const passwordHash = await bcrypt.hash(finalPassword, 10);

        const newUser = await User.create({
            companyId: session.companyId,
            name,
            email,
            passwordHash,
            role,
            managerId: (managerId && managerId !== 'none') ? managerId : undefined,
        });

        return NextResponse.json({ user: newUser });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

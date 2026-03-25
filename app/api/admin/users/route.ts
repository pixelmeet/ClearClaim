import { randomBytes } from 'crypto';
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

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase(),
            companyId: session.companyId,
        });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        const finalPassword =
            password && password.length >= 6
                ? password
                : randomBytes(18).toString('base64url');
        const passwordHash = await bcrypt.hash(finalPassword, 10);

        const newUser = await User.create({
            companyId: session.companyId,
            name,
            email: email.trim().toLowerCase(),
            passwordHash,
            role,
            managerId: managerId && managerId !== 'none' ? managerId : session.userId,
        });

        const safeUser = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            companyId: newUser.companyId,
            managerId: newUser.managerId,
        };

        return NextResponse.json({
            user: safeUser,
            ...(password && password.length >= 6
                ? {}
                : { generatedPassword: finalPassword }),
        });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

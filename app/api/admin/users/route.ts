import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import { getSession } from '@/lib/auth';
import { CreateUserSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { paginationMeta, parsePagination } from '@/lib/pagination';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Pagination
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const role = searchParams.get('role');
        const filter: Record<string, any> = { companyId: session.companyId };
        if (role) {
            filter.role = role;
        }

        const users = await User.find(filter)
            .select('-passwordHash') // sensitive
            .populate('managerId', 'name email') // Populate manager details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(filter);

        return NextResponse.json({
            users,
            pagination: paginationMeta(page, limit, total),
        });
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

        if (role === UserRole.EMPLOYEE && (!managerId || managerId === 'none')) {
            return NextResponse.json(
                { error: 'Employees must have a manager assigned' },
                { status: 400 }
            );
        }

        const finalPassword =
            password && password.length >= 8
                ? password
                : randomBytes(18).toString('base64url');
        const passwordHash = await bcrypt.hash(finalPassword, 10);

        const newUser = await User.create({
            companyId: session.companyId,
            name,
            email: email.trim().toLowerCase(),
            passwordHash,
            role,
            managerId: managerId && managerId !== 'none' ? managerId : undefined,
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
            ...(password && password.length >= 8
                ? {}
                : { generatedPassword: finalPassword }),
        });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validation';
import { createSessionCookie } from '@/lib/auth/createSessionCookie';
import { verifyPassword } from '@/lib/auth/verifyPassword';
import { UserRole } from '@/lib/types';

const ROLE_REDIRECTS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin',
  [UserRole.MANAGER]: '/dashboard',
  [UserRole.EMPLOYEE]: '/dashboard',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = result.data;
    const emailLower = email.trim().toLowerCase();

    await connectToDatabase();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSessionCookie({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      companyId: user.companyId.toString(),
    });

    const redirectTo = ROLE_REDIRECTS[user.role as UserRole] ?? '/dashboard';

    return NextResponse.json({
      success: true,
      redirectTo,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

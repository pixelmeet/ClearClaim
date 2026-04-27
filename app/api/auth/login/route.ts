import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validation';
import { createSessionCookie } from '@/lib/auth/createSessionCookie';
import { verifyPassword } from '@/lib/auth/verifyPassword';
import { UserRole } from '@/lib/types';
import { clientKeyFromRequest, rateLimit } from '@/lib/rateLimit';
import { getRoleHomePath } from '@/lib/auth/postLoginRedirect';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(
      `login:${clientKeyFromRequest(req)}`,
      20,
      15 * 60 * 1000
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      );
    }

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

    if (user.isDisabled) {
      return NextResponse.json(
        { error: 'Your account has been disabled. Contact your administrator.' },
        { status: 403 }
      );
    }

    if (user.otpPurpose === 'signup') {
      return NextResponse.json(
        { error: 'Please verify your account with OTP before logging in.' },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account was created with Google. Please use Google Sign-in.' },
        { status: 400 }
      );
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

    const redirectTo = getRoleHomePath(user.role as UserRole);

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

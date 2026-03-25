import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import Company from '@/models/Company';
import { SignupSchema } from '@/lib/validation';
import { createSessionCookie } from '@/lib/auth/createSessionCookie';
import { hashPassword } from '@/lib/auth/hashPassword';
import { getCurrencyForCountry } from '@/lib/api/restcountries';
import { clientKeyFromRequest, rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(
      `signup:${clientKeyFromRequest(req)}`,
      10,
      60 * 60 * 1000
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      );
    }

    const body = await req.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, email, password, companyName, country } = result.data;

    await connectToDatabase();

    const companyNameLower = companyName.trim().toLowerCase();
    const emailLower = email.trim().toLowerCase();

    const existingCompany = await Company.findOne({ nameLower: companyNameLower });

    if (!existingCompany) {
      // Company does NOT exist: Create company + ADMIN user
      const defaultCurrency = await getCurrencyForCountry(country);
      const company = await Company.create({
        name: companyName.trim(),
        nameLower: companyNameLower,
        country: country.trim(),
        defaultCurrency,
      });

      const passwordHash = await hashPassword(password);
      const user = (await User.create({
        companyId: company._id,
        name: fullName.trim(),
        email: emailLower,
        passwordHash,
        role: UserRole.ADMIN,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;


      await createSessionCookie({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id.toString(),
      });

      return NextResponse.json({
        success: true,
        redirectTo: '/admin',
        user: { id: user._id.toString(), name: user.name, role: user.role },
      });
    }

    // Company exists: Create EMPLOYEE user
    const existingUser = await User.findOne({
      companyId: existingCompany._id,
      email: emailLower,
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = (await User.create({
      companyId: existingCompany._id,
      name: fullName.trim(),
      email: emailLower,
      passwordHash,
      role: UserRole.EMPLOYEE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;

    await createSessionCookie({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: existingCompany._id.toString(),
    });

    return NextResponse.json({
      success: true,
      redirectTo: '/dashboard',
      user: { id: user._id.toString(), name: user.name, role: user.role },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid country selection') {
        return NextResponse.json(
          { error: 'Invalid country selection' },
          { status: 400 }
        );
      }
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

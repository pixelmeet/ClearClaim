import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import Company from '@/models/Company';
import { SignupSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth/hashPassword';
import { getCurrencyForCountry } from '@/lib/api/restcountries';
import { clientKeyFromRequest, rateLimit } from '@/lib/rateLimit';
import { sendOTPEmail } from '@/lib/email';
import crypto from 'crypto';

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

    const { fullName, email, password, companyName, country, inviteCode } =
      result.data;

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
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      const user = (await User.create({
        companyId: company._id,
        name: fullName.trim(),
        email: emailLower,
        passwordHash,
        otp,
        otpExpires,
        otpPurpose: 'signup',
        role: UserRole.ADMIN,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;

      try {
        await sendOTPEmail(user.email, otp, 'signup');
      } catch (emailError) {
        await User.deleteOne({ _id: user._id });
        await Company.deleteOne({ _id: company._id });
        console.error('Failed to send signup OTP email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        requiresOtp: true,
        email: user.email,
        message: 'Verification code sent to your email.',
      });
    }

    let existingUser = await User.findOne({
      companyId: existingCompany._id,
      email: emailLower,
    });

    // Do not keep stale unverified signup accounts.
    if (
      existingUser &&
      existingUser.otpPurpose === 'signup' &&
      existingUser.otpExpires &&
      Date.now() > new Date(existingUser.otpExpires).getTime()
    ) {
      await User.deleteOne({ _id: existingUser._id });
      existingUser = null;
    }
    if (existingUser) {
      if (existingUser.otpPurpose === 'signup') {
        const otp = crypto.randomInt(100000, 999999).toString();
        existingUser.otp = otp;
        existingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        existingUser.otpPurpose = 'signup';
        await existingUser.save();

        try {
          await sendOTPEmail(existingUser.email, otp, 'signup');
        } catch (emailError) {
          console.error('Failed to resend signup OTP email:', emailError);
          return NextResponse.json(
            { error: 'Failed to send verification email. Please try again.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          requiresOtp: true,
          email: existingUser.email,
          message: 'Verification code sent to your email.',
        });
      }

      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // If company exists but no users were created yet (incomplete bootstrap),
    // allow this signup to become the first ADMIN without invite code.
    const companyUserCount = await User.countDocuments({ companyId: existingCompany._id });
    const isBootstrapAdmin = companyUserCount === 0;

    // Company exists and this is a fresh employee signup:
    // require invite code before allowing new user creation.
    if (!isBootstrapAdmin && (!inviteCode || inviteCode !== existingCompany.inviteCode)) {
      return NextResponse.json(
        { error: 'Invalid invite code. Ask your company admin for the code.' },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(password);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const user = (await User.create({
      companyId: existingCompany._id,
      name: fullName.trim(),
      email: emailLower,
      passwordHash,
      otp,
      otpExpires,
      otpPurpose: 'signup',
      role: isBootstrapAdmin ? UserRole.ADMIN : UserRole.EMPLOYEE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;

    try {
      await sendOTPEmail(user.email, otp, 'signup');
    } catch (emailError) {
      await User.deleteOne({ _id: user._id });
      console.error('Failed to send signup OTP email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      message: isBootstrapAdmin
        ? 'Workspace owner verification code sent to your email.'
        : 'Verification code sent to your email.',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid country selection') {
        return NextResponse.json(
          { error: 'Invalid country selection' },
          { status: 400 }
        );
      }
      
      // Specifically handle MongoDB connection issues
      if (error.message.includes('ECONNREFUSED') || error.name === 'MongooseServerSelectionError') {
        console.error('DATABASE CONNECTIVITY ERROR:', error);
        return NextResponse.json(
          { error: 'Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas Network Access.' },
          { status: 503 }
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

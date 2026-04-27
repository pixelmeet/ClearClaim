import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Company from '@/models/Company';
import { getCurrencyForCountry } from '@/lib/api/restcountries';
import { createSessionCookie } from '@/lib/auth/createSessionCookie';
import { UserRole } from '@/lib/types';
import { decodeGoogleOnboardingState } from '@/lib/auth/googleOnboardingState';

const GoogleCompleteSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('create'),
    companyName: z.string().min(2),
    country: z.string().min(2),
  }),
  z.object({
    mode: z.literal('join'),
    companyName: z.string().min(2),
    inviteCode: z.string().min(4),
  }),
]);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('google_onboarding_state')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Missing onboarding state.' }, { status: 401 });
  }
  const state = await decodeGoogleOnboardingState(token);
  if (!state) {
    return NextResponse.json({ error: 'Invalid or expired onboarding state.' }, { status: 401 });
  }
  return NextResponse.json({
    fullName: state.name,
    email: state.email,
  });
}

export async function POST(req: NextRequest) {
  try {
    const stateToken = req.cookies.get('google_onboarding_state')?.value;
    if (!stateToken) {
      return NextResponse.json({ error: 'Google onboarding session expired.' }, { status: 401 });
    }
    const onboardingState = await decodeGoogleOnboardingState(stateToken);
    if (!onboardingState) {
      return NextResponse.json({ error: 'Invalid Google onboarding session.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = GoogleCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid onboarding data.' }, { status: 400 });
    }

    await connectToDatabase();

    const data = parsed.data;
    const emailLower = onboardingState.email;
    const name = onboardingState.name;
    const googleId = onboardingState.googleId;

    const existingByGoogle = await User.findOne({ googleId });
    if (existingByGoogle) {
      return NextResponse.json({ error: 'This Google account is already linked.' }, { status: 409 });
    }

    const existingByEmail = await User.findOne({ email: emailLower });
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login with Google again.' },
        { status: 409 }
      );
    }

    if (data.mode === 'create') {
      const companyName = data.companyName.trim();
      const companyNameLower = companyName.toLowerCase();
      const country = data.country.trim();

      const existingCompany = await Company.findOne({ nameLower: companyNameLower });
      if (existingCompany) {
        return NextResponse.json(
          { error: 'Company already exists. Use join with invite code.' },
          { status: 409 }
        );
      }

      const defaultCurrency = await getCurrencyForCountry(country);
      const company = await Company.create({
        name: companyName,
        nameLower: companyNameLower,
        country,
        defaultCurrency,
      });

      const user = await User.create({
        companyId: company._id,
        name,
        email: emailLower,
        googleId,
        role: UserRole.ADMIN,
      });

      await createSessionCookie({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: UserRole.ADMIN,
        companyId: user.companyId.toString(),
      });

      const response = NextResponse.json({ success: true, redirectTo: '/admin' });
      response.cookies.delete('google_onboarding_state');
      return response;
    }

    const companyName = data.companyName.trim();
    const companyNameLower = companyName.toLowerCase();
    const inviteCode = data.inviteCode.trim().toUpperCase();

    const company = await Company.findOne({ nameLower: companyNameLower });
    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    if (!company.inviteCode || company.inviteCode.toUpperCase() !== inviteCode) {
      return NextResponse.json({ error: 'Invalid invite code.' }, { status: 403 });
    }

    const user = await User.create({
      companyId: company._id,
      name,
      email: emailLower,
      googleId,
      role: UserRole.EMPLOYEE,
    });

    await createSessionCookie({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: UserRole.EMPLOYEE,
      companyId: user.companyId.toString(),
    });

    const response = NextResponse.json({ success: true, redirectTo: '/dashboard' });
    response.cookies.delete('google_onboarding_state');
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid country selection') {
      return NextResponse.json({ error: 'Invalid country selection.' }, { status: 400 });
    }
    console.error('Google onboarding completion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

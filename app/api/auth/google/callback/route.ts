import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { loginUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const app_url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!code) {
        return NextResponse.redirect(`${app_url}/login?error=no_code`);
    }

    try {
        await connectToDatabase();

        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${app_url}/api/auth/google/callback`
        );

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google Token payload');
        }

        const { email, name, sub: googleId, picture } = payload;

        if (!email) {
            return NextResponse.redirect(`${app_url}/login?error=no_email`);
        }

        // 1. Check if user exists with this googleId
        let user = await User.findOne({ googleId });

        // 2. If not, check if user exists with this email (Link accounts)
        if (!user) {
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                // Link Google account to existing email account
                user.googleId = googleId;
                await user.save();
            }
        }

        // 3. If user still doesn't exist, we need to provision them.
        // HOWEVER, in a multi-tenant app, we need a company.
        // Redirect to a signup completion page if they are brand new.
        if (!user) {
            // For now, redirect to signup with pre-filled info
            const params = new URLSearchParams({
                email,
                name: name || '',
                googleId,
                from: 'google'
            });
            return NextResponse.redirect(`${app_url}/signup/google-complete?${params.toString()}`);
        }

        // 4. Create Session
        await loginUser({
            userId: (user._id as any).toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId.toString(),
        });

        return NextResponse.redirect(`${app_url}/dashboard`);
    } catch (error) {
        console.error('Google OAuth Callback Error:', error);
        return NextResponse.redirect(`${app_url}/login?error=oauth_failed`);
    }
}

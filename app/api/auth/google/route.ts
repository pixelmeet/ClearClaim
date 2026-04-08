import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET(req: NextRequest) {
    try {
        const client_id = process.env.GOOGLE_CLIENT_ID;
        const app_url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        if (!client_id) {
            return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
        }

        const client = new OAuth2Client(
            client_id,
            process.env.GOOGLE_CLIENT_SECRET,
            `${app_url}/api/auth/google/callback`
        );

        const authorizeUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'openid'
            ],
            prompt: 'consent'
        });

        return NextResponse.redirect(authorizeUrl);
    } catch (error) {
        console.error('Google OAuth Initiation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

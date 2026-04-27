import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
    await logoutUser();
    return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET(req: Request) {
    await logoutUser();
    return NextResponse.redirect(new URL('/login', req.url));
}

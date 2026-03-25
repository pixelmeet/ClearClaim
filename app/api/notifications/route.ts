import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';
import { clientKeyFromRequest, rateLimit } from '@/lib/rateLimit';

function isSameOrigin(req: Request): boolean {
    const origin = req.headers.get('origin');
    if (!origin) return false;
    const host = req.headers.get('host');
    if (!host) return false;
    try {
        return new URL(origin).host === host;
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    try {
        const rl = rateLimit(
            `notifications:get:${clientKeyFromRequest(req)}`,
            120,
            60 * 1000
        );
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
                }
            );
        }

        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Pagination support
        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit') || '50';
        const limit = parseInt(limitStr, 10);

        try {
            await connectToDatabase();
        } catch (error) {
            console.error('Fetch notifications DB connect error:', error);
            return NextResponse.json(
                { error: 'Database unavailable' },
                { status: 503 }
            );
        }

        const notifications = await Notification.find({ user: session.userId })
            .sort({ createdAt: -1 })
            .limit(limit);

        const unreadCount = await Notification.countDocuments({ user: session.userId, isRead: false });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const rl = rateLimit(
            `notifications:patch:${clientKeyFromRequest(req)}`,
            60,
            60 * 1000
        );
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
                }
            );
        }

        // CSRF guard for cookie-auth flows: only accept same-origin state changes.
        if (!isSameOrigin(req)) {
            return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
        }

        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { notificationIds, markAllAsRead } = body;

        try {
            await connectToDatabase();
        } catch (error) {
            console.error('Update notifications DB connect error:', error);
            return NextResponse.json(
                { error: 'Database unavailable' },
                { status: 503 }
            );
        }

        if (markAllAsRead) {
            await Notification.updateMany(
                { user: session.userId, isRead: false },
                { $set: { isRead: true } }
            );
        } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
            await Notification.updateMany(
                { _id: { $in: notificationIds }, user: session.userId },
                { $set: { isRead: true } }
            );
        } else {
             return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update notifications error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

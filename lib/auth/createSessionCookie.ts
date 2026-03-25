import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/types';
import { getJwtSecretKey } from '@/lib/auth/jwtSecret';

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

/**
 * Create HttpOnly session cookie for authenticated user
 */
export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecretKey());

  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });
}

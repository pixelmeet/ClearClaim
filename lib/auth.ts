import { cookies } from 'next/headers';
import { getSessionUser } from './auth/getSessionUser';
import { createSessionCookie } from './auth/createSessionCookie';
import { requireAuth as reqAuth } from './auth/requireAuth';
import { requireRole as reqRole } from './auth/requireRole';
import type { SessionPayload } from './auth/getSessionUser';
import { verifyToken } from './auth/verifyToken';
import { UserRole } from './types';

export type JWTPayload = SessionPayload;

export async function signToken(payload: JWTPayload) {
  const { SignJWT } = await import('jose');
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
  const key = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export { verifyToken };

export async function getSession() {
  return getSessionUser();
}

export async function loginUser(payload: JWTPayload) {
  await createSessionCookie(payload);
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function requireAuth(): Promise<JWTPayload> {
  return reqAuth();
}

export async function requireRole(role: UserRole): Promise<JWTPayload> {
  return reqRole(role);
}

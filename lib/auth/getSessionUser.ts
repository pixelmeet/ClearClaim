import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

/**
 * Get logged-in user from session cookie. Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

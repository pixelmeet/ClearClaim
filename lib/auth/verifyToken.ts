import { jwtVerify } from 'jose';
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
 * Verify JWT token (for middleware, which cannot use cookies() async)
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

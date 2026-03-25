import { jwtVerify } from 'jose';
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
 * Verify JWT token (for middleware, which cannot use cookies() async)
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

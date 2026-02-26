import { UserRole } from '@/lib/types';
import { requireAuth } from './requireAuth';
import type { SessionPayload } from './getSessionUser';

/**
 * Require specific role - throws if user doesn't have the role.
 * Admin can access everything.
 */
export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== role && session.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

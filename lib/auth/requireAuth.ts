import { getSessionUser } from './getSessionUser';
import type { SessionPayload } from './getSessionUser';

/**
 * Require authentication - throws if not authenticated.
 * Use in API routes and server components.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSessionUser();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

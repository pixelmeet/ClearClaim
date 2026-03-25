'use server';

import { getSessionUser } from '@/lib/auth/getSessionUser';
import { logoutUser } from '@/lib/auth';

export async function getCurrentUserAction() {
  const session = await getSessionUser();
  if (!session) return null;
  return {
    id: session.userId,
    userId: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    companyId: session.companyId,
  };
}

export async function logoutAction() {
  await logoutUser();
}



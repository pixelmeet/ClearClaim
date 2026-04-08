import { UserRole } from '@/lib/types';

/** Default home path after login / OAuth by role. */
export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.MANAGER:
      return '/manager';
    case UserRole.EMPLOYEE:
    default:
      return '/dashboard';
  }
}

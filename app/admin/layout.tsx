import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { getRoleHomePath } from '@/lib/auth/postLoginRedirect';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }
  if (session.role !== UserRole.ADMIN) {
    redirect(getRoleHomePath(session.role as UserRole));
  }

  return (
    <DashboardShell
      user={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}

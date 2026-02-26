import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, User as UserIcon } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.role !== UserRole.ADMIN) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {/* Sidebar (Left) */}
            <AdminSidebar />

            {/* Main Content Area (Right) */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-16 items-center justify-between border-b px-6 bg-card">
                    <div className="font-semibold text-lg flex items-center gap-2">
                        Welcome, {session.name}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                            <UserIcon className="size-4" />
                            {session.email}
                        </div>
                        <Link href="/api/auth/logout" prefetch={false}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <LogOut className="size-4" />
                                Logout
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    );
}

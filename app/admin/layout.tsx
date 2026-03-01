import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, User as UserIcon, Bell, Search } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.role !== UserRole.ADMIN) {
        redirect('/login');
    }

    // Get initials for avatar
    const initials = session.name
        ? session.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'AD';

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {/* Sidebar (Left) */}
            <AdminSidebar />

            {/* Main Content Area (Right) */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Premium Topbar */}
                <header
                    className="flex h-16 items-center justify-between border-b px-6 relative"
                    style={{
                        background: 'rgba(var(--card-rgb, 255, 255, 255), 0.6)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    {/* Left: Welcome */}
                    <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">
                            Welcome back,{' '}
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                {session.name}
                            </span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full h-9 w-9 hover:bg-primary/5"
                        >
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-glow-pulse" />
                        </Button>

                        {/* Divider */}
                        <div className="h-8 w-px bg-border" />

                        {/* User info */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/50">
                                <UserIcon className="h-3.5 w-3.5" />
                                <span className="max-w-[150px] truncate">{session.email}</span>
                            </div>

                            {/* Avatar */}
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold shadow-sm">
                                {initials}
                            </div>
                        </div>

                        {/* Logout */}
                        <Link href="/api/auth/logout" prefetch={false}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Subtle bottom gradient accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    );
}

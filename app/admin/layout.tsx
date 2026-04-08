import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MobileAdminNav } from '@/components/admin/MobileAdminNav';
import { UserRole } from '@/lib/types';
import { getRoleHomePath } from '@/lib/auth/postLoginRedirect';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, User as UserIcon, Bell, Command } from 'lucide-react';

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

    const initials = session.name
        ? session.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'AD';

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
            {/* Sidebar Desktop */}
            <div className="hidden md:flex">
                <AdminSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Glass Topbar */}
                <header className="flex h-14 items-center justify-between border-b border-border/30 bg-background/60 backdrop-blur-2xl px-4 md:px-6 z-10 shrink-0 sticky top-0">
                    {/* Left */}
                    <div className="flex items-center gap-2">
                        <MobileAdminNav />
                        <div className="hidden sm:flex text-sm font-medium items-center gap-2 text-muted-foreground">
                            <span>Admin</span>
                            <span className="text-border/50">/</span>
                            <span className="text-foreground tracking-tight px-2 py-1 bg-primary/5 text-primary rounded-md font-semibold text-xs">
                                {session.name}
                            </span>
                        </div>
                    </div>

                    {/* Center */}
                    <button
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <Command className="h-3 w-3" />
                        <span>Search</span>
                        <kbd className="ml-2 px-1.5 py-0.5 rounded border border-border/30 bg-muted/30 text-[10px]">⌘K</kbd>
                    </button>

                    {/* Right */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                        </Button>

                        <div className="h-5 w-px bg-border/30 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <span className="max-w-[120px] truncate">{session.email}</span>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground text-[10px] font-bold shadow-sm ring-2 ring-background/50">
                                {initials}
                            </div>
                        </div>

                        <Link href="/api/auth/logout" prefetch={false} className="hidden sm:block">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Log out"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-transparent relative z-0">
                    {children}
                </main>
            </div>
        </div>
    );
}

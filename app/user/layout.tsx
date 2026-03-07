import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { MobileDashboardNav } from '@/components/MobileDashboardNav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    const initials = session.name
        ? session.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'US';

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
            {/* Sidebar Desktop */}
            <div className="hidden md:flex">
                <DashboardSidebar userRole={session.role} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-y-auto relative">
                {/* Premium Topbar  */}
                <header className="flex h-16 items-center justify-between px-4 md:px-6 z-10 shrink-0">
                    {/* Left: Mobile Nav & Welcome */}
                    <div className="flex items-center gap-2">
                        <MobileDashboardNav userRole={session.role} />
                        <div className="hidden sm:flex text-sm font-medium items-center gap-2 text-muted-foreground mr-4">
                            <span>System</span>
                            <span className="text-border">/</span>
                            <span className="text-foreground tracking-tight px-2 py-1 bg-primary/10 text-primary rounded-md font-semibold">
                                Profile
                            </span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full h-9 w-9 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                        </Button>

                        <div className="h-6 w-px bg-border/50 hidden sm:block mx-1" />

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/40 hover:bg-muted/60 transition-colors">
                                <UserIcon className="h-3.5 w-3.5 text-primary" />
                                <span className="max-w-[150px] truncate">{session.email}</span>
                            </div>

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground text-xs font-bold shadow-sm ring-2 ring-background">
                                {initials}
                            </div>
                        </div>

                        <Link href="/api/auth/logout" prefetch={false} className="hidden sm:block ml-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Log out"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 bg-transparent relative z-0">
                    {children}
                </main>
            </div>
        </div>
    );
}

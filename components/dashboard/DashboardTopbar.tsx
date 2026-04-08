'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MobileDashboardNav } from '@/components/MobileDashboardNav';
import { CommandPaletteTrigger } from '@/components/command-palette';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserRole } from '@/lib/types';

interface DashboardTopbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        role?: UserRole;
    };
}

export function DashboardTopbar({ user }: DashboardTopbarProps) {
    const initials = user.name
        ? user.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'US';

    return (
        <header className="flex h-14 items-center justify-between border-b border-border/30 bg-background/60 backdrop-blur-2xl px-4 md:px-6 z-10 shrink-0 sticky top-0">
            {/* Left: Mobile Nav & Breadcrumb */}
            <div className="flex items-center gap-2">
                <MobileDashboardNav userRole={user.role} />
                <div className="hidden sm:flex text-sm font-medium items-center gap-2 text-muted-foreground">
                    <span>System</span>
                    <span className="text-border/50">/</span>
                    <span className="text-foreground tracking-tight px-2 py-1 bg-primary/5 text-primary rounded-md font-semibold text-xs">
                        {user.name}
                    </span>
                </div>
            </div>

            {/* Center: Command Palette Trigger */}
            <CommandPaletteTrigger />

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                <NotificationBell />

                <div className="h-5 w-px bg-border/30 hidden sm:block" />

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="max-w-[120px] truncate">{user.email}</span>
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
    );
}

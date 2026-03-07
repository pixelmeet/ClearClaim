'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building,
    Users,
    CheckSquare,
    FilePlus,
    LogOut,
    Shield,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navSections = [
    {
        label: 'Overview',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Management',
        items: [
            { href: '/admin/company', label: 'Company Settings', icon: Building },
            { href: '/admin/users', label: 'Users', icon: Users },
        ],
    },
    {
        label: 'Workflows',
        items: [
            { href: '/admin/approvals', label: 'Approval Rules', icon: CheckSquare },
            { href: '/admin/admin-approval', label: 'Create Rule', icon: FilePlus },
        ],
    },
];

interface AdminSidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();

    const handleLogout = async () => {
        document.cookie = 'auth_token=; Max-Age=0; path=/;';
        window.location.href = '/login';
    };

    let animIndex = 0;

    return (
        <div className={cn("w-64 h-full flex flex-col relative bg-card/40 backdrop-blur-3xl border-r border-border/50 shadow-sm", className)}>

            {/* Soft Sidebar subtle gradient highlight */}
            <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Logo / Brand */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-foreground leading-tight tracking-tight">
                                ClearClaim
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                                Administrator
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-6 h-px bg-border/40" />

                {/* Navigation sections */}
                <nav className="flex-1 px-4 pt-6 space-y-6 overflow-y-auto">
                    {navSections.map((section) => (
                        <div key={section.label}>
                            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                {section.label}
                            </p>
                            <div className="space-y-1">
                                {section.items.map((link) => {
                                    const isActive =
                                        pathname === '/admin'
                                            ? link.href === '/admin'
                                            : pathname.startsWith(link.href) && link.href !== '/admin';
                                    const currentIndex = animIndex++;
                                    return (
                                        <Link key={link.href} href={link.href} onClick={onNavigate}>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    'w-full justify-start relative group rounded-xl h-10 transition-all duration-300',
                                                    isActive
                                                        ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15'
                                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                )}
                                            >
                                                {/* Active Accent Bar */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-lg bg-primary" />
                                                )}

                                                {/* Icon */}
                                                <link.icon
                                                    className={cn(
                                                        'mr-3 h-4 w-4 transition-all duration-300 shrink-0',
                                                        isActive
                                                            ? 'text-primary'
                                                            : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
                                                    )}
                                                />

                                                <span className="flex-1 text-left text-sm">{link.label}</span>

                                                {/* Active arrow */}
                                                {isActive && (
                                                    <ChevronRight className="h-4 w-4 text-primary/70" />
                                                )}
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-4 space-y-3 mt-auto">
                    {/* Divider */}
                    <div className="h-px bg-border/40 mx-2" />

                    {/* Role badge */}
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                            </span>
                            <span className="text-muted-foreground">Admin System Online</span>
                        </div>
                    </div>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl h-10 transition-all group"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Log out</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

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

export function AdminSidebar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        document.cookie = 'auth_token=; Max-Age=0; path=/;';
        window.location.href = '/login';
    };

    let animIndex = 0;

    return (
        <div className="w-64 h-full flex flex-col relative">
            {/* Glassmorphic background */}
            <div
                className="absolute inset-0 border-r border-sidebar-border"
                style={{
                    background: 'linear-gradient(180deg, var(--sidebar) 0%, rgba(255,255,255,0.4) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            />

            {/* Gradient accent border on left */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary opacity-60" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Logo / Brand */}
                <div className="p-6 pb-4 opacity-0 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                                ClearClaim
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                                Admin Console
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

                {/* Navigation sections */}
                <nav className="flex-1 px-3 pt-4 space-y-5 overflow-y-auto">
                    {navSections.map((section) => (
                        <div key={section.label}>
                            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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
                                        <Link key={link.href} href={link.href}>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    'w-full justify-start relative group opacity-0 animate-slide-in-right h-10 rounded-lg',
                                                    `delay-${(currentIndex + 1) * 100}`,
                                                    isActive
                                                        ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                                        : 'hover:bg-primary/5 hover:text-primary font-normal'
                                                )}
                                            >
                                                {/* Active indicator bar */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-primary to-accent rounded-r-full animate-scale-in" />
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
                                                    <ChevronRight className="h-3.5 w-3.5 text-primary/50 animate-fade-in" />
                                                )}

                                                {/* Hover glow */}
                                                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary/5 to-accent/5 transition-opacity duration-300 -z-10" />
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-3 space-y-2">
                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

                    {/* Role badge */}
                    <div className="px-3 py-2 opacity-0 animate-fade-in delay-700">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow-pulse" />
                            <span className="text-muted-foreground">Admin Access</span>
                        </div>
                    </div>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive/80 hover:text-destructive hover:bg-destructive/10
                                 transition-all duration-300 group relative overflow-hidden rounded-lg h-10 opacity-0 animate-fade-in delay-800"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="text-sm">Logout</span>
                        <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    CheckCircle,
    Users,
    FolderOpen,
    ChevronRight,
    Zap,
    LogOut,
    User,
    Settings,
} from 'lucide-react';

interface SidebarProps {
    userRole?: UserRole;
    className?: string;
    onNavigate?: () => void;
}

const navSections = [
    {
        label: 'Navigation',
        items: [
            {
                label: 'Dashboard',
                hrefFn: (role?: UserRole) => {
                    if (role === UserRole.ADMIN) return '/admin';
                    if (role === UserRole.MANAGER) return '/manager';
                    return '/dashboard';
                },
                icon: LayoutDashboard,
                roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
            },
            {
                label: 'Profile',
                hrefFn: () => '/user',
                icon: User,
                roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
            },
        ],
    },
    {
        label: 'Expenses',
        items: [
            {
                label: 'My Expenses',
                hrefFn: () => '/dashboard/expenses',
                icon: FileText,
                roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
            },
            {
                label: 'New Expense',
                hrefFn: () => '/dashboard/expenses/new',
                icon: PlusCircle,
                roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
            },
        ],
    },
    {
        label: 'Management',
        items: [
            {
                label: 'Pending Approvals',
                hrefFn: () => '/manager/approvals',
                icon: CheckCircle,
                roles: [UserRole.MANAGER, UserRole.ADMIN],
            },
            {
                label: 'Team Expenses',
                hrefFn: () => '/manager/team-expenses',
                icon: FolderOpen,
                roles: [UserRole.MANAGER],
            },
            {
                label: 'Manage Users',
                hrefFn: () => '/admin/users',
                icon: Users,
                roles: [UserRole.ADMIN],
            },
            {
                label: 'Settings',
                hrefFn: () => '/admin/company',
                icon: Settings,
                roles: [UserRole.ADMIN],
            },
        ],
    },
];

export function DashboardSidebar({ userRole, className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
        } finally {
            router.refresh();
            router.push('/login');
        }
    };

    return (
        <div className={cn(
            "w-64 h-full flex flex-col relative",
            "bg-sidebar backdrop-blur-2xl",
            "border-r border-sidebar-border",
            className
        )}>
            {/* Gradient accent line on right edge */}
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Logo / Brand */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-foreground leading-tight tracking-tight">
                                ClearClaim
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                                Expense Management
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-6 h-px bg-border/30" />

                {/* Navigation sections */}
                <nav className="flex-1 px-3 pt-6 space-y-6 overflow-y-auto">
                    {navSections.map((section) => {
                        const visibleItems = section.items.filter(
                            (item) => !userRole || item.roles.includes(userRole)
                        );
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={section.label}>
                                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                    {section.label}
                                </p>
                                <div className="space-y-0.5">
                                    {visibleItems.map((link) => {
                                        const href = link.hrefFn(userRole);
                                        const isActive =
                                            pathname === href ||
                                            (pathname.startsWith(href) &&
                                                href !== '/dashboard' &&
                                                href !== '/admin' &&
                                                href !== '/manager');
                                        return (
                                            <Link key={href} href={href} onClick={onNavigate}>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        'w-full justify-start relative group rounded-xl h-10 transition-all duration-300 px-3',
                                                        isActive
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                    )}
                                                >
                                                    {/* Active Accent Bar */}
                                                    {isActive && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-sm shadow-primary/50" />
                                                    )}

                                                    {/* Icon */}
                                                    <link.icon className={cn(
                                                        'mr-3 h-4 w-4 transition-all duration-300 shrink-0',
                                                        isActive
                                                            ? 'text-primary'
                                                            : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
                                                    )} />

                                                    <span className="flex-1 text-left text-sm">{link.label}</span>

                                                    {/* Active arrow */}
                                                    {isActive && (
                                                        <ChevronRight className="h-3.5 w-3.5 text-primary/50" />
                                                    )}
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="p-4 space-y-3 mt-auto">
                    <div className="h-px bg-border/20 mx-2" />

                    {/* Role badge */}
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                            </span>
                            <span className="text-muted-foreground capitalize">
                                {userRole ? userRole.toLowerCase() : 'User'} Access
                            </span>
                        </div>
                    </div>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl h-10 transition-all group px-3"
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

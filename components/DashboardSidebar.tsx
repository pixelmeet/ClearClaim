'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    CheckCircle,
    Users,
    GitMerge,
    Settings,
    LogOut,
    FolderOpen
} from 'lucide-react';

interface SidebarProps {
    userRole?: UserRole;
}

export function DashboardSidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();

    const handleLogout = async () => {
        document.cookie = 'auth_token=; Max-Age=0; path=/;';
        window.location.href = '/login';
    };

    const getDashboardHref = () => {
        if (userRole === UserRole.ADMIN) return '/admin';
        if (userRole === UserRole.MANAGER) return '/manager';
        if (userRole === UserRole.EMPLOYEE) return '/employee/dashboard';
        return '/dashboard';
    };

    const links = [
        {
            label: 'Dashboard',
            href: getDashboardHref(),
            icon: LayoutDashboard,
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
        },
        {
            label: 'My Expenses',
            href: '/dashboard/expenses',
            icon: FileText,
            roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
        },
        {
            label: 'New Expense',
            href: '/dashboard/expenses/new',
            icon: PlusCircle,
            roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
        },
        {
            label: 'Pending approvals',
            href: '/manager/approvals',
            icon: CheckCircle,
            roles: [UserRole.MANAGER, UserRole.ADMIN],
        },
        {
            label: 'Team Expenses',
            href: '/manager/team-expenses',
            icon: FolderOpen,
            roles: [UserRole.MANAGER],
        },
        {
            label: 'Manage Users',
            href: '/admin/users',
            icon: Users,
            roles: [UserRole.ADMIN],
        },
    ];

    const filteredLinks = links.filter(link => !userRole || link.roles.includes(userRole));

    return (
        <div className="w-64 h-full flex flex-col relative">
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border"
                style={{
                    background: 'linear-gradient(180deg, var(--sidebar) 0%, rgba(255,255,255,0.4) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                }}
            />

            {/* Gradient accent border */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary opacity-60" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Logo area with animated gradient */}
                <div className="p-6 opacity-0 animate-fade-in">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent 
                                   hover:scale-105 transition-transform duration-300 cursor-default">
                        ClearClaim
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">Expense Management</p>
                </div>

                {/* Navigation with staggered animation */}
                <nav className="flex-1 px-4 space-y-1">
                    {filteredLinks.map((link, index) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start relative group opacity-0 animate-slide-in-right",
                                        `delay-${(index + 1) * 100}`,
                                        isActive
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-r-full 
                                                      animate-scale-in" />
                                    )}

                                    {/* Icon with hover animation */}
                                    <link.icon className={cn(
                                        "mr-3 h-4 w-4 transition-all duration-300",
                                        "group-hover:scale-110 group-hover:rotate-3"
                                    )} />

                                    {link.label}

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 
                                                  bg-gradient-to-r from-primary/5 to-accent/5 transition-opacity duration-300 -z-10" />
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout button */}
                <div className="p-4 border-t border-sidebar-border opacity-0 animate-fade-in delay-800">
                    <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 
                                 border-destructive/20 hover:border-destructive/40 transition-all duration-300
                                 group relative overflow-hidden"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                        Logout

                        {/* Subtle hover effect */}
                        <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

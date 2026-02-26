'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building, Users, CheckSquare, FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AdminSidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/admin', label: 'Overview', icon: LayoutDashboard },
        { href: '/admin/company', label: 'Company Settings', icon: Building },
        { href: '/admin/users', label: 'Users', icon: Users },

        { href: '/admin/approvals', label: 'Approval Rules', icon: CheckSquare },
        { href: '/admin/admin-approval', label: 'Create Rule', icon: FilePlus },
    ];

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card px-4 py-8">
            <div className="mb-8 px-2">
                <h2 className="text-xl font-bold font-serif tracking-tight">Admin Console</h2>
                <p className="text-sm text-muted-foreground">Manage your workspace</p>
            </div>

            <nav className="flex flex-1 flex-col gap-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === '/admin' ? link.href === '/admin' : pathname.startsWith(link.href) && link.href !== '/admin';

                    return (
                        <Link key={link.href} href={link.href}>
                            <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={cn(
                                    'w-full justify-start gap-3',
                                    isActive ? 'bg-secondary' : 'hover:bg-muted font-normal'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Button>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

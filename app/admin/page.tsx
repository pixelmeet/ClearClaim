'use client';

import { useEffect, useState } from 'react';
import { Users, UserCog, Building, ShieldAlert, ArrowRight, CheckSquare, Settings, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Analytics {
    totalUsers: number;
    managers: number;
    employees: number;
    disabled: number;
}

export default function AdminDashboardPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                if (res.ok) {
                    const users = data.users || [];
                    setAnalytics({
                        totalUsers: users.length,
                        managers: users.filter((u: { role: string }) => u.role === 'MANAGER').length,
                        employees: users.filter((u: { role: string }) => u.role === 'EMPLOYEE').length,
                        disabled: users.filter((u: { isDisabled: boolean }) => u.isDisabled).length,
                    });
                } else {
                    toast.error(typeof data.error === 'string' ? data.error : 'Failed to load analytics');
                }
            } catch {
                toast.error('Error loading analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: analytics?.totalUsers ?? 0,
            icon: Users,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            trend: '+12%',
        },
        {
            title: 'Managers',
            value: analytics?.managers ?? 0,
            icon: UserCog,
            colorClass: 'text-accent',
            bgClass: 'bg-accent/10',
            trend: null,
        },
        {
            title: 'Employees',
            value: analytics?.employees ?? 0,
            icon: Building,
            colorClass: 'text-success',
            bgClass: 'bg-success/10',
            trend: null,
        },
        {
            title: 'Disabled Accounts',
            value: analytics?.disabled ?? 0,
            icon: ShieldAlert,
            colorClass: 'text-destructive',
            bgClass: 'bg-destructive/10',
            trend: null,
            isDestructive: true,
        },
    ];

    const quickActions = [
        {
            title: 'Manage Users',
            description: 'Add, edit, or remove company users and roles',
            href: '/admin/users',
            icon: Users,
            delay: 'delay-100',
        },
        {
            title: 'Company Settings',
            description: 'Update company name, currency, and preferences',
            href: '/admin/company',
            icon: Settings,
            delay: 'delay-200',
        },
        {
            title: 'Approval Rules',
            description: 'Configure expense approval workflows',
            href: '/admin/approvals',
            icon: CheckSquare,
            delay: 'delay-300',
        },
    ];

    return (
        <div className="space-y-10 p-4 md:p-8 lg:px-10 relative max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)]">
            {/* Soft Ambient Glows */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] rounded-full bg-accent/10 blur-[120px] mix-blend-screen" />
            </div>

            {/* Header */}
            <div className="opacity-0 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div>
                    <h1 className="text-3xl md:text-5xl font-display font-semibold tracking-tight text-foreground">
                        Overview
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base md:text-lg">
                        Global organization snapshot.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="relative rounded-[24px] border border-border/50 bg-card/40 p-6 h-36 opacity-50 overflow-hidden">
                            <div className="animate-pulse absolute inset-0 bg-muted/40" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat, index) => (
                        <div
                            key={stat.title}
                            className={`opacity-0 animate-fade-in-up delay-${(index + 1) * 100} group h-full`}
                        >
                            <div className="glass-panel relative overflow-hidden rounded-[24px] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 h-full">
                                {/* Subtle decorative gradient */}
                                <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500", stat.bgClass.replace('/10', ''))} />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </h3>
                                        <div className={cn("p-2.5 rounded-xl transition-colors duration-300", stat.bgClass, stat.colorClass)}>
                                            <stat.icon className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between mt-2">
                                        <div className="text-4xl font-semibold tracking-tight tabular-nums opacity-0 animate-count-up" style={{ animationDelay: `${(index + 2) * 150}ms` }}>
                                            {stat.value}
                                        </div>
                                        {stat.trend && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/15 text-success">
                                                <TrendingUp className="h-3 w-3" />
                                                {stat.trend}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div className="opacity-0 animate-fade-in-up delay-500 pt-4">
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl font-display font-medium text-foreground">System Actions</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <div key={action.href} className={cn("opacity-0 animate-fade-in-up h-full", action.delay)}>
                            <Link href={action.href} className="block group h-full">
                                <div className="glass-panel relative overflow-hidden rounded-[20px] p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 h-full group-hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors duration-300">
                                                <action.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-background/50 text-muted-foreground group-hover:text-primary">
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                            {action.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

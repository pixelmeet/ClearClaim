'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCog, Building, ShieldAlert, ArrowRight, CheckSquare, Settings, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
            gradient: 'from-primary to-primary/70',
            trend: '+12%',
        },
        {
            title: 'Managers',
            value: analytics?.managers ?? 0,
            icon: UserCog,
            gradient: 'from-blue-500 to-blue-600',
            trend: null,
        },
        {
            title: 'Employees',
            value: analytics?.employees ?? 0,
            icon: Building,
            gradient: 'from-accent to-amber-600',
            trend: null,
        },
        {
            title: 'Disabled Accounts',
            value: analytics?.disabled ?? 0,
            icon: ShieldAlert,
            gradient: 'from-destructive to-red-600',
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
            gradient: 'from-primary/10 to-accent/10',
        },
        {
            title: 'Company Settings',
            description: 'Update company name, currency, and preferences',
            href: '/admin/company',
            icon: Settings,
            gradient: 'from-blue-500/10 to-cyan-500/10',
        },
        {
            title: 'Approval Rules',
            description: 'Configure expense approval workflows',
            href: '/admin/approvals',
            icon: CheckSquare,
            gradient: 'from-accent/10 to-amber-500/10',
        },
    ];

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div className="opacity-0 animate-fade-in-up">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Overview
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Welcome to the Admin Console. Here&apos;s your organization at a glance.
                </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="relative overflow-hidden rounded-2xl border border-card-border bg-card/60 backdrop-blur-xl p-6 h-32">
                            <div className="animate-shimmer absolute inset-0" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, index) => (
                        <div
                            key={stat.title}
                            className={`opacity-0 animate-fade-in-up delay-${(index + 1) * 100} group cursor-default`}
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-card-border bg-card/60 backdrop-blur-xl p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                                {/* Gradient background on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`text-sm font-medium ${stat.isDestructive ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {stat.title}
                                        </h3>
                                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                            <stat.icon className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="text-3xl font-bold tracking-tight opacity-0 animate-count-up" style={{ animationDelay: `${(index + 2) * 150}ms` }}>
                                            {stat.value}
                                        </div>
                                        {stat.trend && (
                                            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                <TrendingUp className="h-3 w-3" />
                                                {stat.trend}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Decorative corner accent */}
                                <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div className="opacity-0 animate-fade-in-up delay-500">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href} className="block group">
                            <div className="relative overflow-hidden rounded-xl border border-card-border bg-card/60 backdrop-blur-xl p-6 hover:shadow-md hover:border-primary/30 transition-all duration-300 h-full">
                                {/* Gradient hover */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70 group-hover:scale-110 transition-transform duration-300">
                                            <action.icon className="h-4 w-4 text-white" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Floating background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            </div>
        </div>
    );
}

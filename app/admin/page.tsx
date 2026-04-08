import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    Users,
    ArrowRight,
    Settings,
    CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdminCompanyUserStatsAction } from '@/app/actions/admin';
import { KPICard } from '@/components/dashboard/kpi-card';

const quickActions = [
    {
        title: 'Manage Users',
        description: 'Add, edit, or remove company users and roles',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Company Settings',
        description: 'Update company name, currency, and preferences',
        href: '/admin/company',
        icon: Settings,
    },
    {
        title: 'All Expenses',
        description: 'View all expenses and perform global overrides',
        href: '/admin/expenses',
        icon: CreditCard,
    },
];

export default async function AdminDashboardPage() {
    const analytics = await getAdminCompanyUserStatsAction();
    if (!analytics) {
        redirect('/login');
    }

    const statCards = [
        {
            title: 'Total Users',
            value: analytics.totalUsers,
            iconName: 'users' as const,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            trend: '+12%',
            trendPositive: true,
        },
        {
            title: 'Managers',
            value: analytics.managers,
            iconName: 'userCog' as const,
            colorClass: 'text-accent',
            bgClass: 'bg-accent/10',
            trend: null,
            trendPositive: true,
        },
        {
            title: 'Employees',
            value: analytics.employees,
            iconName: 'building' as const,
            colorClass: 'text-success',
            bgClass: 'bg-success/10',
            trend: null,
            trendPositive: true,
        },
        {
            title: 'Disabled Accounts',
            value: analytics.disabled,
            iconName: 'shieldAlert' as const,
            colorClass: 'text-destructive',
            bgClass: 'bg-destructive/10',
            trend: null,
            trendPositive: false,
        },
    ];

    return (
        <div className="space-y-8 p-4 md:p-8 lg:px-10 relative max-w-[1600px] mx-auto min-h-[calc(100vh-3.5rem)]">
            {/* Background orbs */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute top-[10%] -left-[10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[300px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
            </div>

            {/* Header */}
            <div className="opacity-0 animate-fade-in-up mt-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-foreground">
                    Overview
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                    Global organization snapshot.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat, index) => (
                    <KPICard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        iconName={stat.iconName}
                        colorClass={stat.colorClass}
                        bgClass={stat.bgClass}
                        trend={stat.trend}
                        trendPositive={stat.trendPositive}
                        index={index}
                    />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="opacity-0 animate-fade-in-up delay-500 pt-2">
                <h2 className="text-xl font-display font-semibold mb-4">System Actions</h2>

                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action, index) => (
                        <div key={action.href} className="opacity-0 animate-fade-in-up h-full" style={{ animationDelay: `${600 + index * 100}ms` }}>
                            <Link href={action.href} className="block group h-full">
                                <div className="glass-panel rounded-2xl p-6 h-full group-hover:glow-primary transition-all duration-500 floating-card">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3 rounded-xl bg-muted/30 group-hover:bg-primary/10 transition-all duration-300">
                                            <action.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="h-8 w-8 rounded-full glass-panel flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-muted-foreground group-hover:text-primary">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors font-display">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {action.description}
                                    </p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

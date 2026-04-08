import { getSession } from '@/lib/auth';
import Link from "next/link";
import { UserRole } from '@/lib/types';
import {
    FileText,
    PlusCircle,
    CheckCircle,
    FolderOpen,
    ArrowRight,
} from 'lucide-react';
import connectToDatabase from '@/lib/db';
import {
    getEmployeeExpenseDashboardStats,
    getManagerTeamExpenseDashboardStats,
} from '@/lib/services/expenseDashboardStats';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

const employeeActions = [
    {
        title: 'My Expenses',
        description: 'View and manage your submitted expenses.',
        href: '/dashboard/expenses',
        icon: FileText,
    },
    {
        title: 'New Expense',
        description: 'Submit a new expense for approval.',
        href: '/dashboard/expenses/new',
        icon: PlusCircle,
    },
];

const managerActions = [
    {
        title: 'Pending Approvals',
        description: 'Review and approve team expense requests.',
        href: '/manager/approvals',
        icon: CheckCircle,
    },
    {
        title: 'Team Expenses',
        description: 'View all team expense submissions.',
        href: '/manager/team-expenses',
        icon: FolderOpen,
    },
    {
        title: 'My Expenses',
        description: 'View and manage your own expenses.',
        href: '/dashboard/expenses',
        icon: FileText,
    },
    {
        title: 'New Expense',
        description: 'Submit a new expense for approval.',
        href: '/dashboard/expenses/new',
        icon: PlusCircle,
    },
];

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) return null;

    await connectToDatabase();

    const role = session.role as UserRole;
    const isManager = role === UserRole.MANAGER;
    const isAdmin = role === UserRole.ADMIN;

    const agg = isManager
        ? await getManagerTeamExpenseDashboardStats(session.companyId, session.userId)
        : await getEmployeeExpenseDashboardStats(session.companyId, session.userId);

    const { totalAmount, pendingCount, approvedCount, companyCurrency } = agg;

    const kpiCards = [
        {
            title: isManager ? 'Team Expenses' : 'Total Expenses',
            value: `${companyCurrency} ${totalAmount.toLocaleString()}`,
            iconName: 'dollarSign',
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            trend: '+12%',
            trendPositive: true,
        },
        {
            title: isManager ? 'Pending Approvals' : 'Pending Approval',
            value: pendingCount.toString(),
            iconName: 'clock',
            colorClass: 'text-warning',
            bgClass: 'bg-warning/10',
            trend: null,
            trendPositive: true,
        },
        {
            title: 'Approved',
            value: approvedCount.toString(),
            iconName: 'checkCircle2',
            colorClass: 'text-success',
            bgClass: 'bg-success/10',
            trend: '+24%',
            trendPositive: true,
        },
    ];

    const actions = isManager ? managerActions : employeeActions;
    const heading = isManager ? 'Manager Dashboard' : (isAdmin ? 'Admin Dashboard' : 'Dashboard');

    return (
        <div className="space-y-8 p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-3.5rem)]">
            {/* Background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[10%] -right-[5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] -left-[5%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <div className="opacity-0 animate-fade-in-up">
                <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
                    {heading}
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                    {isManager ? (
                        "Manage your team's expenses and approvals."
                    ) : (
                        <>
                            Welcome back,{' '}
                            <span className="text-primary font-medium">
                                {session?.name || 'User'}
                            </span>
                            ! Here&apos;s your financial overview.
                        </>
                    )}
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {kpiCards.map((stat, index) => (
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

            {/* Charts Row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ExpenseChart />
                </div>
                <div>
                    <CategoryChart />
                </div>
            </div>

            {/* Quick Actions + Activity Feed */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Quick Actions */}
                <div className="lg:col-span-2 opacity-0 animate-fade-in-up delay-400">
                    <h2 className="text-xl font-display font-semibold mb-4">Quick Actions</h2>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {actions.map((action, index) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="block group opacity-0 animate-fade-in-up"
                                style={{ animationDelay: `${500 + index * 100}ms` }}
                            >
                                <div className="glass-panel rounded-2xl p-6 group-hover:glow-primary transition-all duration-500 h-full floating-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                                            <action.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors font-display">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {action.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div>
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}

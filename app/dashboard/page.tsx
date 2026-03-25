import { getSession } from '@/lib/auth';
import Link from "next/link";
import { UserRole } from '@/lib/types';
import {
    DollarSign,
    Clock,
    CheckCircle2,
    FileText,
    PlusCircle,
    CheckCircle,
    FolderOpen,
    ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Role-specific configuration                                        */
/* ------------------------------------------------------------------ */

// Stats are now calculated dynamically in the component

const employeeActions = [
    {
        title: 'My Expenses',
        description: 'View and manage your submitted expenses.',
        href: '/dashboard/expenses',
        icon: FileText,
        gradient: 'from-primary to-primary/70',
        hoverGradient: 'from-primary/10 to-accent/10',
    },
    {
        title: 'New Expense',
        description: 'Submit a new expense for approval.',
        href: '/dashboard/expenses/new',
        icon: PlusCircle,
        gradient: 'from-accent to-amber-600',
        hoverGradient: 'from-accent/10 to-amber-500/10',
    },
];

const managerActions = [
    {
        title: 'Pending Approvals',
        description: 'Review and approve team expense requests.',
        href: '/manager/approvals',
        icon: CheckCircle,
        gradient: 'from-primary to-primary/70',
        hoverGradient: 'from-primary/10 to-accent/10',
    },
    {
        title: 'Team Expenses',
        description: 'View all team expense submissions.',
        href: '/manager/team-expenses',
        icon: FolderOpen,
        gradient: 'from-accent to-amber-600',
        hoverGradient: 'from-accent/10 to-amber-500/10',
    },
    {
        title: 'My Expenses',
        description: 'View and manage your own expenses.',
        href: '/dashboard/expenses',
        icon: FileText,
        gradient: 'from-blue-500 to-blue-600',
        hoverGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
        title: 'New Expense',
        description: 'Submit a new expense for approval.',
        href: '/dashboard/expenses/new',
        icon: PlusCircle,
        gradient: 'from-emerald-500 to-emerald-600',
        hoverGradient: 'from-emerald-500/10 to-teal-500/10',
    },
];

import connectToDatabase from '@/lib/db';
import {
    getEmployeeExpenseDashboardStats,
    getManagerTeamExpenseDashboardStats,
} from '@/lib/services/expenseDashboardStats';

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

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

    const currentStats = [
        {
            title: isManager ? 'Team Expenses' : 'Total Expenses',
            value: `${companyCurrency} ${totalAmount.toLocaleString()}`,
            icon: DollarSign,
            gradient: 'from-primary to-primary/70',
            delayMs: 100,
        },
        {
            title: isManager ? 'Pending Approvals' : 'Pending Approval',
            value: pendingCount.toString(),
            icon: Clock,
            gradient: 'from-accent to-accent/70',
            delayMs: 200,
        },
        {
            title: 'Approved',
            value: approvedCount.toString(),
            icon: CheckCircle2,
            gradient: 'from-success to-success/70',
            delayMs: 300,
        },
    ];

    const actions = isManager ? managerActions : employeeActions;
    const heading = isManager ? 'Manager Dashboard' : (isAdmin ? 'Admin Dashboard' : 'Dashboard');
    const subtitle = isManager
        ? "Manage your team's expenses and approvals."
        : "Welcome back! Here's an overview of your claims.";

    return (
        <div className="space-y-8 p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div className="opacity-0 animate-fade-in-up">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {heading}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    {isManager ? (
                        subtitle
                    ) : (
                        <>
                            Welcome back,{' '}
                            <span className="text-primary font-medium">
                                {session?.name || 'User'}
                            </span>
                            ! Here&apos;s an overview of your claims.
                        </>
                    )}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentStats.map((stat) => (
                    <div
                        key={stat.title}
                        className="opacity-0 animate-fade-in-up group cursor-default"
                        style={{ animationDelay: `${stat.delayMs}ms` }}
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-card-border 
                                      bg-card/80 backdrop-blur-xl p-8 
                                      hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-500 group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 
                                          group-hover:opacity-[0.03] transition-opacity duration-500`} />
                            <div className="relative z-10 text-left">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        {stat.title}
                                    </h3>
                                    <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-primary/20
                                                  group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="text-4xl font-extrabold tracking-tight text-foreground">
                                    {stat.value}
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                    Live Data
                                </div>
                            </div>
                            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full 
                                          bg-gradient-to-br ${stat.gradient} opacity-10 blur-3xl
                                          group-hover:opacity-30 transition-all duration-700`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="opacity-0 animate-fade-in-up delay-400">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {actions.map((action, index) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="block group opacity-0 animate-fade-in-up"
                            style={{ animationDelay: `${(index + 5) * 100}ms` }}
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-card-border 
                                          bg-card/80 backdrop-blur-xl p-8 
                                          hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:scale-[1.03] transition-all duration-500 h-full group">
                                <div className={`absolute inset-0 bg-gradient-to-r ${action.hoverGradient} 
                                              opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className={`p-4 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg 
                                                      group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
                                            <action.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <ArrowRight className="h-6 w-6 text-primary opacity-0 
                                                             group-hover:opacity-100 group-hover:translate-x-2 
                                                             transition-all duration-500" />
                                    </div>
                                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors duration-300 tracking-tight">
                                        {action.title}
                                    </h3>
                                    <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                                        {action.description}
                                    </p>
                                </div>
                                <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full 
                                              bg-gradient-to-br ${action.gradient} opacity-[0.03] blur-3xl 
                                              group-hover:opacity-20 transition-all duration-700`} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Floating geometric shapes */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: '1s' }} />
            </div>
        </div>
    );
}

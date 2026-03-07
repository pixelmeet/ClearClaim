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

const employeeStats = [
    {
        title: 'Total Expenses',
        value: '$0',
        icon: DollarSign,
        gradient: 'from-primary to-primary/70',
        delay: '100',
    },
    {
        title: 'Pending Approval',
        value: '0',
        icon: Clock,
        gradient: 'from-accent to-accent/70',
        delay: '200',
    },
    {
        title: 'Approved',
        value: '0',
        icon: CheckCircle2,
        gradient: 'from-success to-success/70',
        delay: '300',
    },
];

const managerStats = [
    {
        title: 'Team Expenses',
        value: '$0',
        icon: DollarSign,
        gradient: 'from-primary to-primary/70',
        delay: '100',
    },
    {
        title: 'Pending Approvals',
        value: '0',
        icon: Clock,
        gradient: 'from-accent to-accent/70',
        delay: '200',
    },
    {
        title: 'Approved',
        value: '0',
        icon: CheckCircle2,
        gradient: 'from-success to-success/70',
        delay: '300',
    },
];

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

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
    const session = await getSession();
    const role = session?.role as UserRole | undefined;

    const isManager = role === UserRole.MANAGER;

    const heading = isManager ? 'Manager Dashboard' : 'Dashboard';
    const subtitle = isManager
        ? "Manage your team's expenses and approvals."
        : "Welcome back! Here's an overview of your claims.";

    const stats = isManager ? managerStats : employeeStats;
    const actions = isManager ? managerActions : employeeActions;

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
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className={`opacity-0 animate-fade-in-up delay-${stat.delay} group cursor-default`}
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-card-border 
                                      bg-card/60 backdrop-blur-xl p-6 
                                      hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 
                                          group-hover:opacity-5 transition-opacity duration-300`} />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </h3>
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} 
                                                  group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold tracking-tight">
                                    {stat.value}
                                </div>
                            </div>
                            <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full 
                                          bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl
                                          group-hover:opacity-20 transition-opacity duration-300`} />
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
                            className={`block group opacity-0 animate-fade-in-up delay-${(index + 5) * 100}`}
                        >
                            <div className="relative overflow-hidden rounded-xl border border-card-border 
                                          bg-card/60 backdrop-blur-xl p-6 
                                          hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 h-full">
                                <div className={`absolute inset-0 bg-gradient-to-r ${action.hoverGradient} 
                                              opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-md 
                                                      group-hover:scale-110 transition-transform duration-300`}>
                                            <action.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 
                                                             group-hover:opacity-100 group-hover:translate-x-1 
                                                             transition-all duration-300" />
                                    </div>
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1.5">
                                        {action.description}
                                    </p>
                                </div>
                                <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full 
                                              bg-gradient-to-br ${action.gradient} opacity-10 blur-2xl 
                                              group-hover:opacity-20 transition-opacity duration-300`} />
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

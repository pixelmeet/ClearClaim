import { getSession } from '@/lib/auth';
import Link from "next/link";
import { DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default async function DashboardPage() {
    const session = await getSession();

    const stats = [
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

    return (
        <div className="space-y-8 p-8">
            {/* Header with staggered animation */}
            <div className="opacity-0 animate-fade-in-up">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Dashboard
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Welcome back, <span className="text-primary font-medium">{session?.name || 'User'}</span>!
                    Here&apos;s an overview of your claims.
                </p>
            </div>

            {/* Stats Grid with glassmorphic cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className={`opacity-0 animate-fade-in-up delay-${stat.delay} group cursor-default`}
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-card-border 
                                      bg-card/60 backdrop-blur-xl p-6 
                                      hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            {/* Gradient background on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 
                                          group-hover:opacity-5 transition-opacity duration-300`} />

                            {/* Content */}
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

                            {/* Decorative corner accent */}
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
                    <Link href="/dashboard/expenses" className="block group">
                        <div className="relative overflow-hidden rounded-xl border border-card-border 
                                      bg-card/60 backdrop-blur-xl p-6 
                                      hover:shadow-md hover:border-primary/30 transition-all duration-300">
                            {/* Gradient border on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 
                                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                        Expenses
                                    </h3>
                                    <DollarSign className="h-5 w-5 text-muted-foreground 
                                                         group-hover:text-primary group-hover:scale-110 
                                                         transition-all duration-300" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    View and submit new expense claims
                                </p>
                            </div>

                            {/* Arrow indicator */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                                          group-hover:translate-x-1 transition-all duration-300">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Floating geometric shapes for atmosphere */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: '1s' }} />
            </div>
        </div>
    );
}

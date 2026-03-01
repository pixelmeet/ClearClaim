'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, FolderOpen, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ManagerDashboardPage() {
  const router = useRouter();

  const cards = [
    {
      title: 'Pending Approvals',
      description: 'Review and approve team expense requests.',
      href: '/manager/approvals',
      icon: CheckCircle,
      gradient: 'from-primary to-primary/70',
      hoverGradient: 'from-primary/10 to-accent/10',
      stat: null,
    },
    {
      title: 'Team Expenses',
      description: 'View all team expense submissions.',
      href: '/manager/team-expenses',
      icon: FolderOpen,
      gradient: 'from-accent to-amber-600',
      hoverGradient: 'from-accent/10 to-amber-500/10',
      stat: null,
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Manager Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your team&apos;s expenses and approvals.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={card.href}
            href={card.href}
            className={`block group opacity-0 animate-fade-in-up delay-${(index + 1) * 100}`}
          >
            <div className="relative overflow-hidden rounded-2xl border border-card-border bg-card/60 backdrop-blur-xl p-6 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 h-full">
              {/* Gradient hover background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${card.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {card.description}
                </p>
              </div>

              {/* Decorative corner accent */}
              <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Floating background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}

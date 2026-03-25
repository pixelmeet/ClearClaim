'use client';

import { CheckCircle, FolderOpen, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getManagerStatusAction } from '@/app/actions/manager-status';

export default function ManagerDashboardPage() {
  const [status, setStatus] = useState<{ hasManager: boolean; isManagerFirstEnabled: boolean } | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await getManagerStatusAction();
        if (res.success) {
          setStatus({
            hasManager: res.hasManager ?? false,
            isManagerFirstEnabled: res.isManagerFirstEnabled ?? false,
          });
        }
      } catch (error) {
        console.error('Failed to check manager status:', error);
      }
    }
    checkStatus();
  }, []);

  const showWarning = status?.isManagerFirstEnabled && !status?.hasManager;

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

      {showWarning && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-xl p-6 flex gap-4 items-start animate-fade-in-up border-l-4 border-l-destructive">
           <div className="p-3 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 shadow-lg shadow-destructive/20 hidden sm:block">
             <ShieldAlert className="h-6 w-6 text-white" />
           </div>
           <div className="space-y-1">
             <div className="flex items-center gap-2 sm:gap-0">
               <ShieldAlert className="h-5 w-5 text-destructive sm:hidden" />
               <h3 className="font-bold text-lg text-destructive">Manager Assignment Required</h3>
             </div>
             <p className="text-muted-foreground leading-relaxed">
               Manager-first approval is enabled for your organization, but you don&apos;t have a manager assigned. 
               You will not be able to submit expenses until an administrator assigns a manager to your account.
             </p>
           </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={card.href}
            href={card.href}
            className="block group opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${(index + 1) * 100}ms` }}
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

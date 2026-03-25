'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpenseStatus, Expense } from '@/lib/types';
import { toast } from 'sonner';
import { Users, FileText, Calendar, Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/manager/team-expenses')
            .then(res => res.json())
            .then(data => {
                if (data.expenses) setExpenses(data.expenses);
            })
            .catch(() => toast.error('Failed to load team expenses'))
            .finally(() => setLoading(false));
    }, []);

    const getStatusStyle = (status: ExpenseStatus) => {
        switch (status) {
            case ExpenseStatus.APPROVED:
                return 'bg-success/10 text-success border-success/20';
            case ExpenseStatus.REJECTED:
                return 'bg-destructive/10 text-destructive border-destructive/20';
            case ExpenseStatus.PENDING:
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case ExpenseStatus.SUBMITTED:
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className="space-y-12 p-8 lg:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 opacity-0 animate-fade-in-up">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Enterprise Team Oversight
                    </h2>
                    <p className="text-muted-foreground mt-2 text-lg font-medium">
                        Unified financial monitoring for your department and direct reports.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 text-primary rounded-2xl 
                              border border-primary/10 font-bold shadow-sm">
                    <Users className="w-5 h-5" />
                    <span className="tracking-tight">{expenses.length} Total Records</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                    </div>
                    <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs animate-pulse">Synchronizing Global Claims...</p>
                </div>
            ) : expenses.length === 0 ? (
                <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02] opacity-0 animate-fade-in-up delay-100">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-inner">
                            <FileText className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight mb-2">No active disbursements pending</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm text-lg">
                            Your direct reports haven&apos;t initialized any expense claims for the current period.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 opacity-0 animate-fade-in-up delay-200">
                    {expenses.map((expense, idx) => (
                        <Card
                            key={expense._id}
                            className="border-card-border hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-500 opacity-0 animate-fade-in-up group"
                            style={{ animationDelay: `${(idx % 5 + 1) * 100}ms` }}
                        >
                            <CardContent className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px] shadow-lg shadow-primary/20 group-hover:rotate-6 transition-all duration-500">
                                            <div className="h-full w-full rounded-2xl bg-card flex items-center justify-center">
                                                <span className="text-transparent bg-gradient-to-br from-primary to-accent bg-clip-text font-black text-xl">
                                                    {expense.employeeId?.name?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl leading-none mb-1.5 line-clamp-1 tracking-tight group-hover:text-primary transition-colors">
                                                {expense.employeeId?.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {expense.expenseDate ? format(new Date(expense.expenseDate), 'MMM d, yyyy') : 'No Date'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm">
                                        {expense.category}
                                    </Badge>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 group-hover:bg-muted/50 transition-all duration-300">
                                        <p className="text-sm font-bold leading-relaxed line-clamp-2 min-h-[44px]">
                                            {expense.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4 py-4 border-b border-border/50">
                                        <div className="flex items-end justify-between">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                    <Wallet className="w-3.5 h-3.5" /> Total Claim
                                                </p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">
                                                        {Number(expense.amountOriginal).toLocaleString()}
                                                    </span>
                                                    <span className="text-sm font-black text-muted-foreground/60 uppercase">
                                                        {expense.currencyOriginal}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <Badge className={`px-4 py-2 text-[10px] font-bold shadow-lg shadow-primary/5 border-2 ${getStatusStyle(expense.status)} uppercase tracking-widest rounded-xl transition-all duration-500`}>
                                                    {expense.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wide">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success" />
                                            Updated: {format(new Date(expense.updatedAt || expense.createdAt), 'MMM d, h:mm a')}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

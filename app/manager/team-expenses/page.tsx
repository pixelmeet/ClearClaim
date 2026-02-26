'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpenseStatus, Expense } from '@/lib/types';
import { toast } from 'sonner';
import { Users, FileText, Calendar, Wallet, CheckCircle2 } from 'lucide-react';
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
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between opacity-0 animate-fade-in-up">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Team Expenses
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        View expense history for all your direct reports.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full 
                              border border-primary/20 font-medium">
                    <Users className="w-4 h-4" />
                    {expenses.length} Records
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : expenses.length === 0 ? (
                <Card className="border-dashed border-2 bg-card/60 backdrop-blur-xl opacity-0 animate-fade-in-up delay-100">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold">No team expenses found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            Your direct reports haven&apos;t submitted any expenses yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 opacity-0 animate-fade-in-up delay-100">
                    {expenses.map((expense, idx) => (
                        <Card
                            key={expense._id}
                            className={`border-card-border bg-card/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-in-up delay-${(idx % 5 + 1) * 100}`}
                        >
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-primary font-bold text-lg">
                                                {expense.employeeId?.name?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg leading-none mb-1 line-clamp-1">
                                                {expense.employeeId?.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {expense.expenseDate ? format(new Date(expense.expenseDate), 'MMM d, yyyy') : 'No Date'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20">
                                        {expense.category}
                                    </Badge>
                                </div>

                                <div className="space-y-4 mb-2">
                                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                        <p className="text-sm font-medium line-clamp-2 min-h-[40px]">
                                            {expense.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 py-2 border-b border-border">
                                        <div className="flex items-end justify-between">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Wallet className="w-3 h-3" /> Amount
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                                                        {expense.amountOriginal?.toLocaleString() || '0'}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                                        {expense.currencyOriginal}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end justify-center">
                                                <Badge className={`px-2 py-1 text-xs font-semibold ${getStatusStyle(expense.status)} uppercase tracking-wider`}>
                                                    {expense.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-1 flex items-center text-xs text-muted-foreground">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                        Last updated: {format(new Date(expense.updatedAt || expense.createdAt), 'MMM d, h:mm a')}
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

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApprovalChainStepper } from '@/components/ApprovalChainStepper';

export default function ExpenseDetailPage() {
    const params = useParams();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetch(`/api/expenses/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.expense) setExpense(data.expense);
                })
                .catch(err => console.error('Error:', err))
                .finally(() => setLoading(false));
        }
    }, [params.id]);

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (!expense) return <div className="text-center p-8">Expense not found</div>;

    return (
        <div className="space-y-10 p-2 md:p-6 opacity-0 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Link href="/dashboard/expenses">
                    <Button variant="outline" size="sm" className="rounded-xl px-4 py-5 font-bold tracking-tight shadow-sm hover:translate-x-[-4px] transition-transform duration-300">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Return to Ledger
                    </Button>
                </Link>
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Financial Claim Dossier
                    </h2>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">
                        Transaction ID: <span className="text-foreground/80 font-black">{expense._id}</span>
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                <Card className="lg:col-span-3 rounded-3xl border-card-border overflow-hidden shadow-2xl shadow-foreground/[0.02] delay-100 animate-fade-in-up">
                    <CardHeader className="p-8 border-b border-card-border/50 bg-primary/[0.02]">
                        <CardTitle className="text-xl font-bold tracking-tight">Expense Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</p>
                                <p className="text-xl font-bold tracking-tight">{expense.description}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Classification</p>
                                <div className="pt-1">
                                    <span className="bg-primary/5 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                        {expense.category}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/30 border border-card-border/50 space-y-4">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Financial Valuation</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-4xl font-black tracking-tighter">
                                        {expense.currencyOriginal} {Number(expense.amountOriginal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    {expense.currencyOriginal !== expense.companyCurrency && (
                                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest pt-1">
                                            <div className="h-[1px] w-4 bg-muted-foreground/30" />
                                            {expense.companyCurrency} {Number(expense.amountCompany).toLocaleString(undefined, { minimumFractionDigits: 2 })} Corporate Value (@ {expense.fxRate.toFixed(4)})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Transaction Date</p>
                                <p className="font-bold">{new Date(expense.expenseDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lifecycle Status</p>
                                <Badge
                                    className={`font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm border-2 transition-all duration-300 ${
                                        expense.status === ExpenseStatus.APPROVED
                                            ? 'bg-success/10 text-success border-success/20'
                                            : expense.status === ExpenseStatus.REJECTED
                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}
                                >
                                    {expense.status}
                                </Badge>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Submission History</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    {new Date(expense.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-3xl border-card-border overflow-hidden shadow-2xl shadow-foreground/[0.02] delay-200 animate-fade-in-up">
                    <CardHeader className="p-8 border-b border-card-border/50 bg-primary/[0.02]">
                        <CardTitle className="text-xl font-bold tracking-tight">Authorization Audit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <ApprovalChainStepper 
                            expenseId={expense._id} 
                            currentStepIndex={expense.currentStepIndex} 
                            status={expense.status} 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

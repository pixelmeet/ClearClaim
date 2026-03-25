'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ExpenseStatus, ActionType } from '@/lib/types';

interface ApprovalAction {
    _id: string;
    stepIndex: number;
    approverId: {
        name: string;
        email: string;
        role: string;
    };
    action: ActionType;
    comment?: string;
    createdAt: string;
}

interface Expense {
    _id: string;
    amountOriginal: number;
    currencyOriginal: string;
    amountCompany: number;
    companyCurrency: string;
    fxRate: number;
    category: string;
    description: string;
    expenseDate: string;
    status: ExpenseStatus;
    currentStepIndex: number;
    createdAt: string;
}

export default function ExpenseDetailPage() {
    const params = useParams();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [timeline, setTimeline] = useState<ApprovalAction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetch(`/api/expenses/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.expense) setExpense(data.expense);
                    if (data.timeline) setTimeline(data.timeline);
                })
                .catch(err => console.error('Error:', err))
                .finally(() => setLoading(false));
        }
    }, [params.id]);

    if (loading) {
        return <div className="text-center p-8">Loading...</div>;
    }

    if (!expense) {
        return <div className="text-center p-8">Expense not found</div>;
    }

    const getActionIcon = (action: ActionType) => {
        switch (action) {
            case ActionType.APPROVE:
            case ActionType.OVERRIDE_APPROVE:
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case ActionType.REJECT:
            case ActionType.OVERRIDE_REJECT:
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getActionLabel = (action: ActionType) => {
        switch (action) {
            case ActionType.APPROVE:
                return 'Approved';
            case ActionType.REJECT:
                return 'Rejected';
            case ActionType.OVERRIDE_APPROVE:
                return 'Override Approved';
            case ActionType.OVERRIDE_REJECT:
                return 'Override Rejected';
            default:
                return action;
        }
    };

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
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">current step</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-12 rounded-full bg-muted/50 overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${((expense.currentStepIndex + 1) / 3) * 100}%` }} />
                                    </div>
                                    <p className="font-bold text-sm tracking-tight">Phase {expense.currentStepIndex + 1} of 3</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-3xl border-card-border overflow-hidden shadow-2xl shadow-foreground/[0.02] delay-200 animate-fade-in-up">
                    <CardHeader className="p-8 border-b border-card-border/50 bg-primary/[0.02]">
                        <CardTitle className="text-xl font-bold tracking-tight">Authorization Audit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {timeline.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Awaiting initialization</p>
                            </div>
                        ) : (
                            <div className="space-y-8 relative">
                                <div className="absolute left-[20px] top-2 bottom-6 w-[2px] bg-gradient-to-b from-primary/30 to-transparent" />
                                {timeline.map((action) => (
                                    <div key={action._id} className="flex gap-6 relative group">
                                        <div className="mt-1 h-10 w-10 rounded-xl bg-card border-2 border-card-border shadow-md flex items-center justify-center z-10 group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                                            <div className="group-hover:text-white transition-colors duration-500">
                                                {getActionIcon(action.action)}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="font-black text-sm uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                                                    {getActionLabel(action.action)}
                                                </p>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase border border-muted-foreground/20 px-2 py-0.5 rounded-md">
                                                    Phase {action.stepIndex + 1}
                                                </span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-muted/20 border border-card-border/30 space-y-2 group-hover:bg-muted/40 transition-all duration-300">
                                                <p className="text-sm font-bold tracking-tight">
                                                    {action.approverId.name} 
                                                    <span className="text-muted-foreground ml-1 font-medium italic">({action.approverId.role})</span>
                                                </p>
                                                {action.comment && (
                                                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                                                        &quot;{action.comment}&quot;
                                                    </p>
                                                )}
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pt-1">
                                                    {new Date(action.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

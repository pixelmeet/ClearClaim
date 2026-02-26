'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ActionType, Expense } from '@/lib/types';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, FileText, Calendar, DollarSign, Wallet, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerApprovalsPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [actionType, setActionType] = useState<ActionType | null>(null);
    const [comment, setComment] = useState('');

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/manager/approvals');
            const data = await res.json();
            if (res.ok) setExpenses(data.expenses);
        } catch {
            toast.error('Failed to load approvals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAction = async () => {
        if (!actionType || !selectedExpense) return;

        if (actionType === ActionType.REJECT && !comment) {
            toast.error('Comment is required for rejection');
            return;
        }

        try {
            const res = await fetch('/api/manager/approvals/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenseId: selectedExpense._id,
                    action: actionType,
                    comment,
                }),
            });

            if (res.ok) {
                toast.success(`Expense ${actionType === ActionType.APPROVE ? 'Approved' : 'Rejected'}`);
                setSelectedExpense(null);
                setComment('');
                fetchExpenses();
            } else {
                toast.error('Action failed');
            }
        } catch {
            toast.error('Error processing action');
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-0 animate-fade-in-up">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Pending Approvals
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        Review and action expense claims from your team.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full 
                              border border-primary/20 font-medium text-sm w-full sm:w-auto justify-center">
                    <Clock className="w-4 h-4" />
                    {expenses.length} Pending
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : expenses.length === 0 ? (
                <Card className="border-dashed border-2 bg-card/60 backdrop-blur-xl opacity-0 animate-fade-in-up delay-100">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <h3 className="text-xl font-semibold">You&apos;re all caught up!</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            There are no pending approval requests requiring your attention at this time.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 opacity-0 animate-fade-in-up delay-100">
                    {expenses.map((expense, idx) => (
                        <Card
                            key={expense._id}
                            className={`border-card-border bg-card/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-in-up delay-${(idx % 5 + 1) * 100}`}
                        >
                            <CardContent className="p-4 md:p-6">
                                {/* Header: Employee + Category + Status */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-primary font-bold text-lg">
                                                {expense.employeeId?.name?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-base md:text-lg leading-none mb-1 truncate">
                                                {expense.employeeId?.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {expense.employeeId?.email || ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 w-fit">
                                            {expense.category}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 w-fit uppercase text-[10px] tracking-wider">
                                            {expense.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="bg-muted/30 rounded-lg p-3 border border-border/50 mb-4">
                                    <p className="text-sm font-medium line-clamp-3 break-words">
                                        {expense.description}
                                    </p>
                                </div>

                                {/* Data Rows */}
                                <div className="space-y-3 mb-4">
                                    {/* Expense Date */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> Expense Date
                                        </span>
                                        <span className="font-medium">
                                            {expense.expenseDate ? format(new Date(expense.expenseDate), 'MMM d, yyyy') : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Original Amount */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Wallet className="w-3.5 h-3.5" /> Original Amount
                                        </span>
                                        <span className="font-bold text-lg bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                                            {expense.amountOriginal?.toLocaleString() || '0'}{' '}
                                            <span className="text-xs font-medium text-muted-foreground">{expense.currencyOriginal}</span>
                                        </span>
                                    </div>

                                    {/* Company Amount (if different currency) */}
                                    {expense.companyCurrency && expense.companyCurrency !== expense.currencyOriginal && (
                                        <>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <DollarSign className="w-3.5 h-3.5" /> Company Amount
                                                </span>
                                                <span className="font-semibold">
                                                    {expense.amountCompany?.toLocaleString() || '0'}{' '}
                                                    <span className="text-xs text-muted-foreground">{expense.companyCurrency}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <ArrowRightLeft className="w-3.5 h-3.5" /> FX Rate
                                                </span>
                                                <span className="font-medium text-muted-foreground">
                                                    {expense.fxRate?.toFixed(4) || 'N/A'}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {/* Submitted on */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Submitted
                                        </span>
                                        <span className="font-medium text-xs">
                                            {expense.createdAt ? format(new Date(expense.createdAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-border">
                                    <Button
                                        className="flex-1 min-w-0 gap-1.5 bg-success/10 text-success hover:bg-success/20 hover:text-success border-success/20 shadow-none text-sm"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setSelectedExpense(expense); setActionType(ActionType.APPROVE); }}
                                    >
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Approve
                                    </Button>
                                    <Button
                                        className="flex-1 min-w-0 gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive/20 shadow-none text-sm"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setSelectedExpense(expense); setActionType(ActionType.REJECT); }}
                                    >
                                        <XCircle className="w-4 h-4 flex-shrink-0" /> Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{actionType === ActionType.APPROVE ? 'Approve Expense' : 'Reject Expense'}</DialogTitle>
                        <DialogDescription>
                            {actionType === ActionType.APPROVE
                                ? 'Are you sure you want to approve this expense?'
                                : 'Please provide a reason for rejection.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Optional comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedExpense(null)}>Cancel</Button>
                        <Button
                            variant={actionType === ActionType.REJECT ? 'destructive' : 'default'}
                            onClick={handleAction}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

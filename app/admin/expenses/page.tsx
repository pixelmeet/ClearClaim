'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseStatus, ActionType, Expense } from '@/lib/types';
import { toast } from 'sonner';

import { ApprovalChainStepper } from '@/components/ApprovalChainStepper';

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [viewingDetails, setViewingDetails] = useState<Expense | null>(null);
    const [overrideAction, setOverrideAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [comment, setComment] = useState('');

    const fetchExpenses = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/expenses');
            const data = await res.json();
            if (res.ok) setExpenses(data.expenses);
        } catch {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleOverride = async () => {
        if (!comment || comment.length < 5) {
            toast.error('Comment (min 5 chars) is required for overrides');
            return;
        }

        try {
            const res = await fetch('/api/admin/expenses/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenseId: selectedExpense?._id,
                    action: overrideAction,
                    comment,
                }),
            });

            if (res.ok) {
                toast.success('Override applied successfully');
                setOverrideAction(null);
                setSelectedExpense(null);
                setComment('');
                fetchExpenses();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to apply override');
            }
        } catch {
            toast.error('Error applying override');
        }
    };

    const handleRegularAction = async (expenseId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetch('/api/manager/approvals/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenseId, action, comment: 'Admin Approval' }),
            });
            if (res.ok) {
                toast.success(`Expense ${action.toLowerCase()}ed`);
                fetchExpenses();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Action failed');
            }
        } catch {
            toast.error('Error processing action');
        }
    };

    const getStatusVariant = (status: ExpenseStatus) => {
        if (status === ExpenseStatus.APPROVED) return 'default';
        if (status === ExpenseStatus.REJECTED) return 'destructive';
        return 'secondary';
    };

    return (
        <div className="space-y-8 p-8">
            {/* Header with animation */}
            <div className="opacity-0 animate-fade-in-up">
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    All Expenses
                </h2>
                <p className="text-muted-foreground mt-2 text-lg">
                    Overview and override controls for expense management.
                </p>
            </div>

            {/* Glassmorphic table card */}
            <Card className="opacity-0 animate-fade-in-up delay-200 border-card-border bg-card/60 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-card-border hover:bg-transparent">
                                    <TableHead className="font-semibold">Employee</TableHead>
                                    <TableHead className="font-semibold">Description</TableHead>
                                    <TableHead className="font-semibold">Amount</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
                                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No expenses found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenses.map((expense, index) => (
                                        <TableRow
                                            key={expense._id}
                                            className="border-b border-card-border hover:bg-primary/5 transition-colors duration-200 group"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <TableCell className="font-medium">
                                                {expense.employeeId?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {expense.description}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono font-semibold">
                                                    {expense.currencyOriginal} {expense.amountOriginal}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    ({expense.companyCurrency} {expense.amountCompany})
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge
                                                        variant={getStatusVariant(expense.status)}
                                                        className="font-medium"
                                                    >
                                                        {expense.status}
                                                    </Badge>
                                                    {expense.isAutoApproved && (
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/50 text-primary bg-primary/5">
                                                            Auto-Approved (Rule)
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {new Date(expense.expenseDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setViewingDetails(expense)}
                                                        className="hover:bg-primary/10 transition-colors"
                                                    >
                                                        Details
                                                    </Button>
                                                {expense.status === ExpenseStatus.PENDING && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedExpense(expense);
                                                                setOverrideAction('APPROVE');
                                                            }}
                                                            className="hover:bg-success/10 hover:text-success hover:border-success/30 
                                                                     transition-all duration-300"
                                                        >
                                                            Override
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleRegularAction(expense._id, 'APPROVE')}
                                                            className="hover:shadow-md transition-all"
                                                        >
                                                            Act as Approver
                                                        </Button>
                                                    </>
                                                )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Override Dialog */}
            <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Force Administrative Action</DialogTitle>
                        <DialogDescription className="text-base">
                            Force <span className={`font-black ${overrideAction === 'APPROVE' ? 'text-green-500' : 'text-red-500'}`}>
                                {overrideAction}
                            </span> this transaction? This bypasses the remaining workflow steps.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Reason for administrative override (minimum 5 characters)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[120px] bg-background/50 border-card-border focus:border-primary/50 
                                     transition-colors duration-300 rounded-2xl p-4 font-medium"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedExpense(null)}
                            className="hover:bg-muted font-bold uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleOverride}
                            disabled={comment.length < 5}
                            className="bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] px-8"
                        >
                            Authorize Override
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!viewingDetails} onOpenChange={(open) => !open && setViewingDetails(null)}>
                <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-2xl border-card-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                    {viewingDetails && (
                        <div className="flex flex-col h-full max-h-[85vh]">
                            <div className="p-8 border-b border-card-border/50 bg-primary/[0.02]">
                                <DialogTitle className="text-3xl font-black tracking-tighter">Transaction Audit Portfolio</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
                                    ID: {viewingDetails._id}
                                </DialogDescription>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Employee</p>
                                        <p className="text-lg font-bold">{viewingDetails.employeeId?.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</p>
                                        <p className="text-lg font-black">{viewingDetails.currencyOriginal} {viewingDetails.amountOriginal}</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-muted/20 border border-card-border/30">
                                    <ApprovalChainStepper 
                                        expenseId={viewingDetails._id} 
                                        currentStepIndex={viewingDetails.currentStepIndex} 
                                        status={viewingDetails.status} 
                                    />
                                </div>
                            </div>

                            <DialogFooter className="p-8 border-t border-card-border/50 bg-background/50">
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingDetails(null)}
                                    className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Close Portfolio
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Atmospheric background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: '2s' }} />
            </div>
        </div>
    );
}

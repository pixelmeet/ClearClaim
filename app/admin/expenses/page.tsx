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

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [overrideAction, setOverrideAction] = useState<ActionType | null>(null);
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
        if (!comment) {
            toast.error('Comment is required for overrides');
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
                toast.success('Override applied');
                setOverrideAction(null);
                setSelectedExpense(null);
                setComment('');
                fetchExpenses();
            } else {
                toast.error('Failed to apply override');
            }
        } catch {
            toast.error('Error applying override');
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
                                                {expense.status === ExpenseStatus.PENDING && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedExpense(expense);
                                                                setOverrideAction(ActionType.OVERRIDE_APPROVE);
                                                            }}
                                                            className="hover:bg-success/10 hover:text-success hover:border-success/30 
                                                                     transition-all duration-300"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedExpense(expense);
                                                                setOverrideAction(ActionType.OVERRIDE_REJECT);
                                                            }}
                                                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30
                                                                     transition-all duration-300"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Override Dialog with animations */}
            <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Override Expense</DialogTitle>
                        <DialogDescription className="text-base">
                            Force <span className="font-semibold text-foreground">
                                {overrideAction === ActionType.OVERRIDE_APPROVE ? 'APPROVE' : 'REJECT'}
                            </span> this expense?
                            This action will be logged.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Reason for override..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-background/50 border-card-border focus:border-primary/50 
                                     transition-colors duration-300"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedExpense(null)}
                            className="hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleOverride}
                            className="bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg 
                                     hover:scale-105 transition-all duration-300"
                        >
                            Confirm Override
                        </Button>
                    </DialogFooter>
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

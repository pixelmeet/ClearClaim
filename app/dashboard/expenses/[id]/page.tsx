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
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/expenses">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Expenses
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Expense Details</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Expense Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="font-medium">{expense.description}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <p className="font-medium">{expense.category}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-medium">
                                {expense.currencyOriginal} {expense.amountOriginal.toFixed(2)}
                                {expense.currencyOriginal !== expense.companyCurrency && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                        ({expense.companyCurrency} {expense.amountCompany.toFixed(2)} @ {expense.fxRate.toFixed(4)})
                                    </span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge
                                variant={
                                    expense.status === ExpenseStatus.APPROVED ? 'default' :
                                        expense.status === ExpenseStatus.REJECTED ? 'destructive' :
                                            'secondary'
                                }
                            >
                                {expense.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Step</p>
                            <p className="font-medium">Step {expense.currentStepIndex + 1}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Approval Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeline.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No approval actions yet</p>
                        ) : (
                            <div className="space-y-4">
                                {timeline.map((action) => (
                                    <div key={action._id} className="flex gap-3 pb-4 border-b last:border-0">
                                        <div className="mt-1">
                                            {getActionIcon(action.action)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{getActionLabel(action.action)}</p>
                                                <span className="text-xs text-muted-foreground">
                                                    Step {action.stepIndex + 1}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                by {action.approverId.name} ({action.approverId.role})
                                            </p>
                                            {action.comment && (
                                                <p className="text-sm mt-1 italic">&quot;{action.comment}&quot;</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(action.createdAt).toLocaleString()}
                                            </p>
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

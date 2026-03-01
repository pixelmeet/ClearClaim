'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpenseStatus, Expense } from '@/lib/types';
import { PlusCircle, Loader2, FileText } from 'lucide-react';

export default function MyExpensesPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/expenses')
            .then(res => res.json())
            .then(data => {
                if (data.expenses) setExpenses(data.expenses);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center opacity-0 animate-fade-in-up">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        My Expenses
                    </h2>
                    <p className="text-muted-foreground mt-1">Track and manage your expense claims.</p>
                </div>
                <Link href="/dashboard/expenses/new">
                    <Button className="gap-2 shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                        New Expense
                    </Button>
                </Link>
            </div>

            {/* Table */}
            <div className="opacity-0 animate-fade-in-up delay-100">
                <Card className="border-card-border bg-card/60 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Description</TableHead>
                                    <TableHead className="font-semibold">Category</TableHead>
                                    <TableHead className="font-semibold">Amount</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                                                <p className="text-muted-foreground">No expenses found. Submit your first expense!</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenses.map((expense) => (
                                        <TableRow
                                            key={expense._id}
                                            className="cursor-pointer hover:bg-primary/[0.02] transition-colors duration-200"
                                            onClick={() => router.push(`/dashboard/expenses/${expense._id}`)}
                                        >
                                            <TableCell className="text-muted-foreground">
                                                {new Date(expense.expenseDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium">{expense.description}</TableCell>
                                            <TableCell>
                                                <span className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium">
                                                    {expense.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium">{expense.currencyOriginal} {expense.amountOriginal}</span>
                                                    <br />
                                                    <span className="text-xs text-muted-foreground">
                                                        ({expense.companyCurrency} {expense.amountCompany})
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        expense.status === ExpenseStatus.APPROVED
                                                            ? 'default'
                                                            : expense.status === ExpenseStatus.REJECTED
                                                                ? 'destructive'
                                                                : 'secondary'
                                                    }
                                                    className="font-medium"
                                                >
                                                    {expense.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

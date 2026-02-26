'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpenseStatus, Expense } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

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
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">My Expenses</h2>
                <Link href="/dashboard/expenses/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Expense
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">No expenses found.</TableCell></TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense._id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/expenses/${expense._id}`)}>
                                        <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell>{expense.category}</TableCell>
                                        <TableCell>
                                            {expense.currencyOriginal} {expense.amountOriginal} <br />
                                            <span className="text-xs text-muted-foreground">({expense.companyCurrency} {expense.amountCompany})</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={expense.status === ExpenseStatus.APPROVED ? 'default' : expense.status === ExpenseStatus.REJECTED ? 'destructive' : 'secondary'}>
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
    );
}

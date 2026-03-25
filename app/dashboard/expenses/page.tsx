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
        <div className="space-y-10 p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 opacity-0 animate-fade-in-up">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Personal Expense Ledger
                    </h2>
                    <p className="text-muted-foreground mt-2 text-lg">Detailed history and status of your enterprise claims.</p>
                </div>
                <Link href="/dashboard/expenses/new">
                    <Button size="lg" className="shadow-xl shadow-primary/20 gap-3 group">
                        <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        Initiate New Claim
                    </Button>
                </Link>
            </div>

            {/* Table Container */}
            <div className="opacity-0 animate-fade-in-up delay-200">
                <Card className="border-card-border overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-b border-card-border/50 hover:bg-muted/30">
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-6 px-6">Initialization Date</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Description & Context</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Classification</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Valuation (Local / Corporate)</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-right px-6">Lifecycle Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Synchronizing financial records...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center px-6">
                                                <div className="flex flex-col items-center gap-6 py-12">
                                                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center border border-dashed border-muted-foreground/30">
                                                        <FileText className="h-8 w-8 text-muted-foreground/40" />
                                                    </div>
                                                    <div className="max-w-md">
                                                        <p className="text-xl font-bold mb-2">No active claims detected</p>
                                                        <p className="text-muted-foreground mb-8">Your expense ledger is currently empty. Start by initiating a new claim to track your enterprise spending.</p>
                                                        <Link href="/dashboard/expenses/new">
                                                            <Button variant="outline" className="rounded-xl px-8 border-dashed border-2">
                                                                Add First Expense
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map((expense) => (
                                            <TableRow
                                                key={expense._id}
                                                className="group cursor-pointer hover:bg-primary/[0.03] border-b border-card-border/30 transition-all duration-300"
                                                onClick={() => router.push(`/dashboard/expenses/${expense._id}`)}
                                            >
                                                <TableCell className="text-sm font-medium text-muted-foreground px-6 py-6 group-hover:text-foreground transition-colors">
                                                    {new Date(expense.expenseDate).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                                        {expense.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-primary/5 text-primary border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">
                                                        {expense.category}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-base tracking-tight">
                                                            {expense.currencyOriginal} {Number(expense.amountOriginal).toLocaleString()}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 min-h-0">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                {expense.companyCurrency} {Number(expense.amountCompany).toLocaleString()} eq.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-6">
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm border-2 transition-all duration-300 ${
                                                            expense.status === ExpenseStatus.APPROVED
                                                                ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                                                                : expense.status === ExpenseStatus.REJECTED
                                                                    ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                                        }`}
                                                    >
                                                        {expense.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

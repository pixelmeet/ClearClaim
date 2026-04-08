'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpenseStatus, Expense } from '@/lib/types';
import { PlusCircle, Loader2, FileText, Calendar, Tag, ArrowRight } from 'lucide-react';

function getStatusStyles(status: ExpenseStatus) {
    if (status === ExpenseStatus.APPROVED)
        return 'bg-success/10 text-success border-success/20 hover:bg-success/20';
    if (status === ExpenseStatus.REJECTED)
        return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20';
}

/* ─── Mobile Expense Card ─── */
function ExpenseCard({ expense, index }: { expense: Expense; index: number }) {
    const router = useRouter();

    return (
        <motion.div
            className="glass-panel rounded-2xl p-4 sm:p-5 cursor-pointer group hover:glow-primary transition-all duration-300"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push(`/dashboard/expenses/${expense._id}`)}
        >
            {/* Header row: Description + Status */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                        {expense.description}
                    </h3>
                </div>
                <Badge
                    variant="outline"
                    className={`font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 shrink-0 ${getStatusStyles(expense.status)}`}
                >
                    {expense.status}
                </Badge>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(expense.expenseDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
                <span className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    <span className="uppercase tracking-wider font-semibold text-primary">
                        {expense.category}
                    </span>
                </span>
            </div>

            {/* Amount row */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="font-bold text-lg text-foreground tabular-nums">
                        {expense.currencyOriginal} {Number(expense.amountOriginal).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        ≈ {expense.companyCurrency} {Number(expense.amountCompany).toLocaleString()}
                    </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
        </motion.div>
    );
}

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
        <div className="space-y-6 sm:space-y-8 lg:space-y-10 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 opacity-0 animate-fade-in-up">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Personal Expense Ledger
                    </h2>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                        Detailed history and status of your enterprise claims.
                    </p>
                </div>
                <Link href="/dashboard/expenses/new" className="w-full sm:w-auto">
                    <Button size="lg" className="shadow-xl shadow-primary/20 gap-3 group w-full sm:w-auto">
                        <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="sm:inline">Initiate New Claim</span>
                    </Button>
                </Link>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center gap-4 py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Synchronizing financial records...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && expenses.length === 0 && (
                <div className="flex flex-col items-center gap-6 py-12 sm:py-24">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center border border-dashed border-muted-foreground/30">
                        <FileText className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div className="max-w-md text-center">
                        <p className="text-lg sm:text-xl font-bold mb-2">No active claims detected</p>
                        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
                            Your expense ledger is currently empty. Start by initiating a new claim to track your enterprise spending.
                        </p>
                        <Link href="/dashboard/expenses/new">
                            <Button variant="outline" className="rounded-xl px-8 border-dashed border-2">
                                Add First Expense
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* ─── Mobile Card View (shown below md) ─── */}
            {!loading && expenses.length > 0 && (
                <div className="md:hidden space-y-3 opacity-0 animate-fade-in-up delay-200">
                    {expenses.map((expense, index) => (
                        <ExpenseCard key={expense._id} expense={expense} index={index} />
                    ))}
                </div>
            )}

            {/* ─── Desktop Table View (shown at md+) ─── */}
            {!loading && expenses.length > 0 && (
                <div className="hidden md:block opacity-0 animate-fade-in-up delay-200">
                    <Card className="border-card-border overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 border-b border-card-border/50 hover:bg-muted/30">
                                            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 px-6">Date</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-widest py-5">Description</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 hidden lg:table-cell">Category</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-widest py-5">Amount</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 text-right px-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.map((expense) => (
                                            <TableRow
                                                key={expense._id}
                                                className="group cursor-pointer hover:bg-primary/[0.03] border-b border-card-border/30 transition-all duration-300"
                                                onClick={() => router.push(`/dashboard/expenses/${expense._id}`)}
                                            >
                                                <TableCell className="text-sm font-medium text-muted-foreground px-6 py-5 group-hover:text-foreground transition-colors whitespace-nowrap">
                                                    {new Date(expense.expenseDate).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                                        {expense.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 hidden lg:table-cell">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-primary/5 text-primary border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">
                                                        {expense.category}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-base tracking-tight tabular-nums">
                                                            {expense.currencyOriginal} {Number(expense.amountOriginal).toLocaleString()}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                {expense.companyCurrency} {Number(expense.amountCompany).toLocaleString()} eq.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm border-2 transition-all duration-300 ${getStatusStyles(expense.status)}`}
                                                    >
                                                        {expense.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

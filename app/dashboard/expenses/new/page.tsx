'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreateExpenseSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseCategory } from '@/lib/types';
import { toast } from 'sonner';
import { Upload, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
// Common currencies
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD'];

export default function NewExpensePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrHealth, setOcrHealth] = useState<'ok' | 'degraded' | 'error' | 'loading'>('loading');
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof CreateExpenseSchema>>({
        resolver: zodResolver(CreateExpenseSchema),
        defaultValues: {
            amountOriginal: 0,
            currencyOriginal: 'USD',
            category: ExpenseCategory.OTHER,
            description: '',
            expenseDate: '', // Set on client side to avoid hydration mismatch
        },
    });

    // Set today's date only on the client to prevent SSR/client date mismatch
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        form.setValue('expenseDate', today);

        // Fetch OCR health status
        async function checkHealth() {
            try {
                const res = await fetch('/api/ocr/health');
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'degraded') {
                        setOcrHealth('degraded');
                    } else if (data.status === 'error') {
                        setOcrHealth('error');
                    } else {
                        setOcrHealth('ok');
                    }
                } else {
                    setOcrHealth('error');
                }
            } catch {
                setOcrHealth('error');
            }
        }
        checkHealth();
    }, [form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            setReceiptPreview(URL.createObjectURL(file));
        }
    };

    const removeReceipt = () => {
        setReceiptFile(null);
        setReceiptPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const extractDetails = async () => {
        if (!receiptFile) return;

        setOcrLoading(true);
        toast.info('Analyzing receipt...');

        try {
            const formData = new FormData();
            formData.append('file', receiptFile);

            const res = await fetch('/api/ocr', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                if (res.status === 503 || data.error?.includes('quota is 0')) {
                    throw new Error(data.error || 'OCR is currently unavailable. Please enter details manually.');
                }
                throw new Error(data.error || 'Failed to analyze receipt');
            }

            const data = await res.json();

            if (data.note === 'Gemini unavailable') {
                toast.warning('OCR is currently unavailable. Please enter details manually.');
                return;
            }

            if (data.amount && data.amount !== 'N/A') {
                form.setValue('amountOriginal', Number(data.amount));
            }
            if (data.currency && data.currency !== 'N/A' && CURRENCIES.includes(data.currency.toUpperCase())) {
                form.setValue('currencyOriginal', data.currency.toUpperCase());
            }
            if (data.description && data.description !== 'N/A') {
                form.setValue('description', `${data.description}${data.merchant && data.merchant !== 'N/A' ? ` at ${data.merchant}` : ''}`);
            }
            if (data.date && data.date !== 'N/A') {
                const parts = data.date.split('/');
                if (parts.length === 3) {
                    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    form.setValue('expenseDate', formattedDate);
                }
            }
            if (data.category && data.category !== 'N/A') {
                const upperCat = data.category.toUpperCase();
                if (Object.values(ExpenseCategory).includes(upperCat as ExpenseCategory)) {
                    form.setValue('category', upperCat as ExpenseCategory);
                } else {
                    const catMap: Record<string, ExpenseCategory> = {
                        'FOOD': ExpenseCategory.MEALS,
                        'TRAVEL': ExpenseCategory.TRAVEL,
                        'OFFICE': ExpenseCategory.SUPPLIES,
                        'SOFTWARE': ExpenseCategory.SOFTWARE,
                        'TRAINING': ExpenseCategory.OTHER,
                    };
                    if (catMap[upperCat]) {
                        form.setValue('category', catMap[upperCat]);
                    }
                }
            }

            toast.success('Receipt analyzed and form auto-filled!');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Error parsing receipt');
        } finally {
            setOcrLoading(false);
        }
    };

    async function onSubmit(values: z.infer<typeof CreateExpenseSchema>) {
        setLoading(true);
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                toast.success('Expense submitted!');
                router.push('/dashboard/expenses');
            } else {
                const data = await res.json();
                toast.error(typeof data.error === 'string' ? data.error : 'Submission failed');
            }
        } catch {
            toast.error('Error submitting expense');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6" suppressHydrationWarning>
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Sparkles className="w-5 h-5 mr-2 text-primary" />
                        Smart Receipt Processing
                    </CardTitle>
                    <CardDescription>Upload a receipt to automatically extract and fill expense details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(ocrHealth === 'degraded' || ocrHealth === 'error') && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex gap-3 text-amber-900">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm text-amber-800">AI extraction temporarily unavailable</h4>
                                <p className="text-xs mt-0.5 text-amber-700">Smart Receipt Processing is experiencing capacity issues. You can still upload a receipt for reference and fill in the details manually below.</p>
                            </div>
                        </div>
                    )}

                    {!receiptPreview ? (
                        <div className="flex justify-center w-full">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-24 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-primary/5 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-muted-foreground">Click to upload receipt for OCR</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-background flex items-center justify-center">
                                <img src={receiptPreview} alt="Receipt Preview" className="max-h-full object-contain" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                    onClick={removeReceipt}
                                    disabled={ocrLoading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                type="button"
                                className="w-full"
                                onClick={extractDetails}
                                disabled={ocrLoading || ocrHealth === 'degraded' || ocrHealth === 'error'}
                            >
                                {ocrLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing Receipt...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Extract Details with AI
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Submit New Expense</CardTitle>
                    <CardDescription>Enter expense details. Amount will be converted to company currency.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amountOriginal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currencyOriginal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {CURRENCIES.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                    {/* TODO: Add search or full list if needed */}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ExpenseCategory).map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="expenseDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Expense</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value} />
                                                {/* Zod schema accepts string or Date. Form defaults string. */}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Dinner with client..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Expense'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

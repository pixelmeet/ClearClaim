'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCompanySchema } from '@/lib/validation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building } from 'lucide-react';

export default function AdminCompanyPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const form = useForm<z.infer<typeof UpdateCompanySchema>>({
        resolver: zodResolver(UpdateCompanySchema),
        defaultValues: {
            name: '',
            country: '',
            defaultCurrency: '',
        },
    });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch('/api/admin/company');
                const data = await res.json();
                if (res.ok) {
                    form.reset({
                        name: data.company.name,
                        country: data.company.country,
                        defaultCurrency: data.company.defaultCurrency,
                    });
                } else {
                    toast.error(typeof data.error === 'string' ? data.error : 'Failed to load company settings');
                }
            } catch {
                toast.error('Error loading company settings');
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, [form]);

    async function onSubmit(values: z.infer<typeof UpdateCompanySchema>) {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Company settings updated successfully!');
            } else {
                toast.error(typeof data.error === 'string' ? data.error : 'Failed to update company settings');
            }
        } catch {
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 p-8 max-w-3xl">
            {/* Header */}
            <div className="opacity-0 animate-fade-in-up">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Company Settings
                </h2>
                <p className="text-muted-foreground mt-1">Manage your company&apos;s core information.</p>
            </div>

            {/* Form Card */}
            <div className="opacity-0 animate-fade-in-up delay-100">
                <Card className="border-card-border bg-card/60 backdrop-blur-xl overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                                <Building className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle>General Information</CardTitle>
                                <CardDescription>
                                    Update your company name, location, and default currency.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Acme Corp" className="bg-background/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="country"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Country</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="United States" className="bg-background/50" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="defaultCurrency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Default Currency</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="USD" maxLength={3} className="uppercase bg-background/50" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">3-letter ISO code (e.g. USD, EUR, GBP)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-border/50">
                                        <Button type="submit" disabled={saving} className="gap-2 shadow-sm">
                                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Ensure FormDescription is available if missing from local components (fallback rendering safely)
function FormDescription({ className, children }: { className?: string, children: React.ReactNode }) {
    return <p className={`text-[0.8rem] text-muted-foreground ${className || ''}`}>{children}</p>
}

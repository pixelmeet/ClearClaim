'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoginSchema } from '@/lib/validation';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const redirectTo = data.redirectTo || '/dashboard';
      toast.success('Welcome back to ClearClaim');
      router.refresh();
      router.push(redirectTo);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans overflow-hidden bg-background">
      {/* Left Panel: Elite Branding & Illustration */}
      <div className="hidden lg:flex relative bg-[#020617] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 mb-8 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span className="text-white/60 text-sm font-medium tracking-wide">Elite FinTech Solutions</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Scale Your Enterprise with <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Intelligence</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-12">
              Automate your claim lifecycle, detect risks instantly, and gain unparalleled financial clarity.
            </p>
            
            <div className="grid grid-cols-2 gap-6 text-left">
              {[
                { label: 'Enterprises', value: '500+' },
                { label: 'Claims Processed', value: '1M+' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                  <div className="text-white/40 text-sm mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Minimalist Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        <div className="max-w-md w-full relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground text-lg">Enter your details to continue to ClearClaim.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        className="h-12 bg-muted/30 border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel className="text-sm font-semibold uppercase tracking-wider text-muted-foreground m-0">Password</FormLabel>
                      <Link href="/forgot-password" className="text-primary text-xs font-semibold hover:underline">
                        Forgot?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 bg-muted/30 border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : 'Sign in to Dashboard'}
              </Button>
            </form>
          </Form>

          <p className="mt-12 text-center text-muted-foreground">
            New to the platform?{' '}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Create an enterprise account
            </Link>
          </p>
        </div>
        
        {/* Subtle background element for mobile */}
        <div className="lg:hidden absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      </div>
    </div>
  );
}

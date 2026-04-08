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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoginSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Fingerprint, Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
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
      if (!res.ok) throw new Error(data.error || 'Login failed');

      const redirectTo = data.redirectTo || '/dashboard';
      toast.success('Welcome back to ClearClaim');
      router.refresh();
      router.push(redirectTo);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/google';
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#0B0F1A] text-white overflow-hidden relative">
      {/* Full-page animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_20%,rgba(168,85,247,0.06),transparent_50%)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Left Panel — 3D Perspective Visual */}
      <div className="hidden lg:flex items-center justify-center w-1/2 relative p-12">
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Floating 3D Card Stack */}
            <div className="perspective-[1200px]">
              <motion.div
                className="relative"
                animate={{ rotateY: [-2, 2, -2], rotateX: [1, -1, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Back card */}
                <div className="absolute inset-0 translate-y-4 translate-x-4 bg-white/[0.03] rounded-3xl border border-white/[0.05] backdrop-blur-xl" />
                {/* Middle card */}
                <div className="absolute inset-0 translate-y-2 translate-x-2 bg-white/[0.04] rounded-3xl border border-white/[0.06] backdrop-blur-xl" />
                {/* Front card */}
                <div className="relative bg-white/[0.06] rounded-3xl border border-white/[0.08] backdrop-blur-2xl p-10 shadow-2xl shadow-primary/10">
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">ClearClaim</h3>
                      <p className="text-xs text-white/40">Enterprise Dashboard</p>
                    </div>
                    <div className="ml-auto flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    </div>
                  </div>

                  {/* Mock KPI cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Total Spent', value: '$24,580', color: 'text-primary' },
                      { label: 'Pending', value: '12', color: 'text-warning' },
                      { label: 'Approved', value: '48', color: 'text-success' },
                    ].map((kpi, i) => (
                      <motion.div
                        key={i}
                        className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.05]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.15 }}
                      >
                        <p className="text-[10px] text-white/40 mb-1">{kpi.label}</p>
                        <p className={`font-bold text-sm ${kpi.color}`}>{kpi.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Mock chart */}
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] mb-6">
                    <p className="text-xs text-white/40 mb-3">Expense Trends</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[35, 50, 42, 60, 55, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-primary/40 to-primary/80 rounded-sm"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mock activity */}
                  <div className="space-y-2.5">
                    {[
                      { text: 'Flight to NYC', amount: '$1,250', status: 'approved', statusColor: 'bg-success' },
                      { text: 'Client Dinner', amount: '$185', status: 'pending', statusColor: 'bg-warning' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center justify-between text-xs bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + i * 0.1 }}
                      >
                        <span className="text-white/70">{item.text}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/80 font-medium">{item.amount}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.statusColor} text-white`}>
                            {item.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating badges */}
            <motion.div
              className="absolute -top-6 -right-4 bg-white/[0.06] backdrop-blur-2xl rounded-2xl px-4 py-3 border border-white/[0.08] shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-white/70 font-medium">Just approved</span>
                <span className="text-sm font-bold text-success">$2,450</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-6 bg-white/[0.06] backdrop-blur-2xl rounded-2xl px-4 py-3 border border-white/[0.08] shadow-xl"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-primary" />
                <span className="text-xs text-white/60">256-bit encrypted</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-6 sm:p-10 lg:p-16 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Clear<span className="text-primary">Claim</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-white/50 text-base">
              Sign in to your ClearClaim dashboard.
            </p>
          </div>

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-6 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all duration-300 text-white font-medium group"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/30 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                        <Input
                          type="email"
                          placeholder="name@company.com"
                          className="h-12 pl-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 rounded-xl text-white placeholder:text-white/20 transition-all"
                          {...field}
                        />
                      </div>
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        Password
                      </FormLabel>
                      <Link href="/forgot-password" className="text-primary text-xs font-medium hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="h-12 pl-11 pr-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 rounded-xl text-white placeholder:text-white/20 transition-all"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-13 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-xl transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-white/40 text-sm">
              New to the platform?{' '}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-white/15 text-xs">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>SOC 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fingerprint className="h-3 w-3" />
              <span>GDPR</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

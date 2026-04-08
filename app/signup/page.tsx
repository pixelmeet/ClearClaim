'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SignupSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  Shield, ArrowRight, Lock, Mail, User, Building, Globe, Eye, EyeOff,
  Fingerprint, Check, Sparkles, ArrowLeft,
} from 'lucide-react';

interface CountryData {
  name: { common: string };
  cca2: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      companyName: '',
      country: '',
      inviteCode: '',
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const name = params.get('name');
    if (email) form.setValue('email', email, { shouldDirty: true });
    if (name) form.setValue('fullName', name, { shouldDirty: true });
  }, [form]);

  const password = form.watch('password');
  const passStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      .then((res) => res.json())
      .then((data: CountryData[]) => {
        const sorted = data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sorted);
      })
      .catch((err) => console.error('Failed to fetch countries', err));
  }, []);

  useEffect(() => {
    if (!requiresOtp || resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [requiresOtp, resendCooldown]);

  async function onResendOtp() {
    if (resendCooldown > 0) return;
    const values = form.getValues();
    await onSubmit(values);
  }

  async function onVerifyOtp() {
    if (otp.length < 6) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForVerification, otp, flow: 'signup' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      toast.success('Account verified successfully!');
      router.refresh();
      router.push(data.redirectTo || '/dashboard');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  function handleGoogleSignup() {
    window.location.href = '/api/auth/google';
  }

  async function onSubmit(values: z.infer<typeof SignupSchema>) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === 'object'
            ? Object.values(data.error).flat().join(' ')
            : data.error || 'Signup failed';
        throw new Error(msg);
      }

      const redirectTo = data.redirectTo || '/dashboard';
      
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setEmailForVerification(data.email);
        setResendCooldown(60);
        toast.info(data.message || 'Verification code sent');
        return;
      }

      toast.success(
        data.user?.role === 'ADMIN'
          ? 'Enterprise workspace created successfully!'
          : 'Account created successfully!'
      );
      router.refresh();
      router.push(redirectTo);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#0B0F1A] text-white overflow-hidden relative">
      {/* Full-page animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_70%_30%,rgba(168,85,247,0.08),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_30%_80%,rgba(99,102,241,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Left Panel — 3D Feature Showcase */}
      <div className="hidden lg:flex items-center justify-center w-[45%] relative p-12">
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Hero text */}
            <div className="mb-10">
              <motion.div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md mb-5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-white/60 text-xs font-medium">14-day free trial</span>
              </motion.div>

              <h1 className="text-4xl xl:text-5xl font-display font-bold tracking-tight leading-tight mb-5">
                Build your{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  expense command center
                </span>
              </h1>
              <p className="text-white/50 text-lg leading-relaxed">
                Join 500+ companies using ClearClaim to automate approvals, enforce policies, and get real-time financial visibility.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-4 mb-10">
              {[
                { text: 'AI-powered receipt OCR extraction', delay: 0.5 },
                { text: 'Multi-step approval workflows', delay: 0.6 },
                { text: 'Role-based dashboards (Admin, Manager, Employee)', delay: 0.7 },
                { text: 'SOX-ready immutable audit trail', delay: 0.8 },
              ].map((feature) => (
                <motion.div
                  key={feature.text}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: feature.delay }}
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-white/70 text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Social proof */}
            <motion.div
              className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.06] backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex -space-x-2">
                  {[
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-[#0B0F1A] object-cover"
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-[#0B0F1A] flex items-center justify-center text-[10px] text-primary font-bold">
                    +497
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">500+ teams trust ClearClaim</p>
                  <p className="text-xs text-white/40">Rated 4.9/5 by finance professionals</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex items-center justify-center w-full lg:w-[55%] p-6 sm:p-8 lg:p-12 relative z-10">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Clear<span className="text-primary">Claim</span>
            </span>
          </Link>

          <div className="mb-7">
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-2">
              Create your workspace
            </h1>
            <p className="text-white/50 text-sm">
              Start your 14-day premium trial. No credit card required.
            </p>
          </div>

          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-5 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all duration-300 text-white font-medium"
            onClick={handleGoogleSignup}
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
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/30 font-medium">or create with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {!requiresOtp ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                          Company
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input placeholder="Acme Inc" className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white placeholder:text-white/20 text-sm" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                          Country
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white text-sm">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-white/20" />
                                <SelectValue placeholder="Select" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.cca2} value={c.name.common}>{c.name.common}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input placeholder="Jane Smith" className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white placeholder:text-white/20 text-sm" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                          Work Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input type="email" placeholder="jane@acme.com" className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white placeholder:text-white/20 text-sm" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 8 characters"
                            className="h-11 pl-10 pr-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white placeholder:text-white/20 text-sm"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            suppressHydrationWarning
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      {/* Password strength meter */}
                      {password && (
                        <div className="flex gap-1.5 mt-2">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passStrength.level
                                  ? passStrength.level <= 1
                                    ? 'bg-destructive'
                                    : passStrength.level <= 2
                                      ? 'bg-warning'
                                      : passStrength.level <= 3
                                        ? 'bg-primary'
                                        : 'bg-success'
                                  : 'bg-white/[0.06]'
                                }`}
                            />
                          ))}
                          <span className={`text-[10px] font-medium ml-1.5 ${passStrength.level <= 1 ? 'text-destructive' :
                              passStrength.level <= 2 ? 'text-warning' :
                                passStrength.level <= 3 ? 'text-primary' : 'text-success'
                            }`}>
                            {passStrength.label}
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                        Invite Code (if joining existing company)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter invite code"
                          className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white placeholder:text-white/20 text-sm uppercase"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Terms */}
                <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.05] flex items-start gap-2.5">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <p className="text-white/40 text-[11px] leading-relaxed">
                    By signing up, you agree to our <strong className="text-white/60">Terms of Service</strong> and <strong className="text-white/60">Privacy Policy</strong>.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-xl transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating workspace...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Enterprise Workspace
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setRequiresOtp(false)}
                suppressHydrationWarning
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to signup
              </button>

              <div>
                <h2 className="text-xl font-bold mb-2">Verify your email</h2>
                <p className="text-white/50 text-sm">
                  We&apos;ve sent a 6-digit code to <span className="text-white/80 font-medium">{emailForVerification}</span>.
                </p>
              </div>

              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(v) => setOtp(v)}
                  className="gap-3"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl bg-white/[0.03] border-white/[0.08]" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl bg-white/[0.03] border-white/[0.08]" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl bg-white/[0.03] border-white/[0.08]" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl bg-white/[0.03] border-white/[0.08]" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl bg-white/[0.03] border-white/[0.08]" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl bg-white/[0.03] border-white/[0.08]" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={onVerifyOtp}
                  disabled={verifying || otp.length < 6}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl"
                >
                  {verifying ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-white/40 text-sm">
                    Didn&apos;t receive the code?{" "}
                    <button
                      onClick={onResendOtp}
                      disabled={resendCooldown > 0}
                      suppressHydrationWarning
                      className={`font-semibold ${resendCooldown > 0 ? "text-white/20 cursor-not-allowed" : "text-primary hover:underline"}`}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Trust */}
          <div className="mt-6 flex items-center justify-center gap-6 text-white/15 text-xs">
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

function getPasswordStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak' };
  if (score <= 2) return { level: 2, label: 'Fair' };
  if (score <= 3) return { level: 3, label: 'Good' };
  return { level: 4, label: 'Strong' };
}

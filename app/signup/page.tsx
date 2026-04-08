'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SignupSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface CountryData {
  name: { common: string };
  cca2: string;
}

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

      if (data.requiresOtp) {
        setOtpEmail(data.email || values.email);
        setRequiresOtp(true);
        toast.success(data.message || 'Verification code sent to your email.');
        return;
      }

      const redirectTo = data.redirectTo || '/dashboard';
      toast.success('Account created successfully!');
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

  async function onVerifyOtp() {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpEmail,
          otp,
          flow: 'signup',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      toast.success(data.message || 'Account verified successfully.');
      router.refresh();
      router.push(data.redirectTo || '/dashboard');
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

  async function onResendOtp() {
    if (resendCooldown > 0 || resendLoading || !otpEmail) {
      return;
    }

    setResendLoading(true);
    try {
      const currentValues = form.getValues();
      const payload = {
        ...currentValues,
        email: otpEmail,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === 'object'
            ? Object.values(data.error).flat().join(' ')
            : data.error || 'Failed to resend code';
        throw new Error(msg);
      }

      if (!data.requiresOtp) {
        throw new Error('Unable to resend verification code at this time.');
      }

      setOtp('');
      setResendCooldown(30);
      toast.success('A new verification code has been sent.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to resend verification code');
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans overflow-hidden bg-background">
      {/* Left Panel: Elite Branding & Narrative */}
      <div className="hidden lg:flex relative bg-[#020617] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 mb-8 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
              <span className="text-white/60 text-sm font-medium tracking-wide">Enterprise Onboarding</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Build a High-Performance <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">FinTech Stack</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-12">
              Join the world's most innovative companies using ClearClaim to automate their financial operations.
            </p>
            
            <div className="space-y-4 text-left">
              {[
                'Instant AI-powered OCR extraction',
                'Enterprise-grade RBAC & security',
                'Seamless ERP integrations',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">✓</div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Sophisticated Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative overflow-hidden overflow-y-auto">
        <div className="max-w-xl w-full relative z-10 pb-12">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Create Your Workspace</h2>
            <p className="text-muted-foreground text-lg">Start your 14-day premium trial today.</p>
          </div>

          {requiresOtp ? (
            <div className="space-y-6 rounded-xl border border-border/50 bg-muted/20 p-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Verify your email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the 6-digit code sent to <span className="font-medium">{otpEmail}</span>.
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="button"
                className="w-full h-12"
                disabled={loading}
                onClick={onVerifyOtp}
              >
                {loading ? 'Verifying...' : 'Verify and continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                disabled={resendLoading || resendCooldown > 0 || loading}
                onClick={onResendOtp}
              >
                {resendLoading
                  ? 'Resending...'
                  : resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend OTP'}
              </Button>
            </div>
          ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Global" className="h-12 bg-muted/30 border-border/50 focus:border-primary rounded-xl" {...field} />
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 focus:border-primary rounded-xl">
                            <SelectValue placeholder="Select" />
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

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Johnathan Doe" className="h-12 bg-muted/30 border-border/50 focus:border-primary rounded-xl" {...field} />
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Work Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@acme.com" className="h-12 bg-muted/30 border-border/50 focus:border-primary rounded-xl" {...field} />
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 bg-muted/30 border-border/50 focus:border-primary rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary" />
                <p className="text-primary/80 text-xs leading-relaxed">
                  By signing up, you agree to our <strong>Enterprise Terms of Service</strong> and <strong>Data Privacy Policy</strong>.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Creating workspace...' : 'Initialize Enterprise Workspace'}
              </Button>
            </form>
          </Form>
          )}

          <p className="mt-10 text-center text-muted-foreground">
            Operational already?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CountryData {
  name: { common: string };
  cca2: string;
}

type Mode = 'create' | 'join';

export function GoogleCompleteForm() {
  const router = useRouter();
  const [identity, setIdentity] = useState<{ fullName: string; email: string } | null>(null);
  const fullName = identity?.fullName ?? '';
  const email = identity?.email ?? '';

  const [mode, setMode] = useState<Mode>('create');
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetch('/api/auth/google/complete')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Google setup link expired');
        setIdentity({
          fullName: String(data.fullName ?? ''),
          email: String(data.email ?? ''),
        });
      })
      .catch(() => {
        setIdentity(null);
      });
  }, []);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      .then((res) => res.json())
      .then((data: CountryData[]) => {
        const sorted = data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sorted);
      })
      .catch(() => {
        toast.error('Failed to load countries.');
      });
  }, []);

  const canSubmit = useMemo(() => {
    if (!fullName || !email) return false;
    if (!companyName.trim()) return false;
    if (mode === 'create') return !!country;
    return !!inviteCode.trim();
  }, [fullName, email, companyName, mode, country, inviteCode]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const payload =
        mode === 'create'
          ? {
              mode,
              companyName,
              country,
            }
          : {
              mode,
              companyName,
              inviteCode,
            };

      const res = await fetch('/api/auth/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to complete setup');
      }

      toast.success('Workspace setup complete!');
      router.refresh();
      router.push(data.redirectTo || '/dashboard');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Unable to complete setup');
    } finally {
      setLoading(false);
    }
  }

  if (!fullName || !email) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-xl font-semibold mb-2">Google setup link expired</h1>
          <p className="text-sm text-white/60 mb-5">
            Please start again from the signup page.
          </p>
          <Button className="w-full" onClick={() => router.push('/signup')}>
            Back to signup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Complete your Google signup</h1>
          <p className="text-sm text-white/60 mt-1">
            Choose how you want to use ClearClaim.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => setMode('create')}
            className="w-full"
          >
            Create new company
          </Button>
          <Button
            type="button"
            variant={mode === 'join' ? 'default' : 'outline'}
            onClick={() => setMode('join')}
            className="w-full"
          >
            Join with invite code
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-2 block">Full name</label>
            <Input value={fullName} readOnly className="bg-white/[0.04] border-white/[0.12]" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-2 block">Email</label>
            <Input value={email} readOnly className="bg-white/[0.04] border-white/[0.12]" />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-2 block">Company name</label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={mode === 'create' ? 'Acme Inc' : 'Your company name'}
            className="bg-white/[0.04] border-white/[0.12]"
          />
        </div>

        {mode === 'create' ? (
          <div>
            <label className="text-xs text-white/50 mb-2 block">Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.12]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.cca2} value={c.name.common}>
                    {c.name.common}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <label className="text-xs text-white/50 mb-2 block">Invite code</label>
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ENTER INVITE CODE"
              className="bg-white/[0.04] border-white/[0.12] uppercase"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full"
        >
          {loading ? 'Completing setup...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

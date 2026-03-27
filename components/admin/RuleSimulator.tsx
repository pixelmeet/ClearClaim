'use client';

import { useState } from 'react';

export function RuleSimulator({ users }: { users: any[] }) {
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('');
  const [result, setResult]         = useState<any>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function simulate() {
    if (!employeeId || !amount) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/policy-rules/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, amount: Number(amount), category: category || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 p-5 border border-border/50 rounded-2xl bg-card/40 backdrop-blur-sm">
      <p className="text-sm font-semibold mb-1 text-foreground">Rule simulator</p>
      <p className="text-xs text-muted-foreground mb-4">
        Test which rule would fire for a given expense before going live.
      </p>
      <div className="flex gap-2 flex-wrap mb-4">
        <select
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
          className="flex-[2] min-w-[160px] h-9 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select employee…</option>
          {users.map((u: any) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="flex-1 min-w-[100px] h-9 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          placeholder="Category (optional)"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="flex-1 min-w-[120px] h-9 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={simulate}
          disabled={loading || !employeeId || !amount}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Simulating…' : 'Simulate'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-3">{error}</p>
      )}

      {result && (
        <div className="text-sm">
          {result.blocked ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="text-destructive font-medium">⊘ Blocked</span>
              <span className="text-muted-foreground">— no matching rule and default is set to block.</span>
            </div>
          ) : result.autoApprove ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-green-600 dark:text-green-400 font-medium">✓ Auto-approved</span>
              <span className="text-muted-foreground">by rule: &ldquo;{result.ruleName}&rdquo;</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-primary font-medium mb-3">
                ✓ Rule matched: &ldquo;{result.ruleName}&rdquo;
              </p>
              <div className="flex flex-col gap-2">
                {result.chain.map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-16 text-muted-foreground font-medium">Step {i + 1}</span>
                    <span className="font-medium text-foreground">
                      {step.approverName ?? step.approverRole ?? step.approverType}
                    </span>
                    {step.label && (
                      <span className="text-muted-foreground">({step.label})</span>
                    )}
                    {step.required && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">required</span>
                    )}
                    {step.autoApprove && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">auto</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

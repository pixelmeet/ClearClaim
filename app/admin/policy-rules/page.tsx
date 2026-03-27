'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { RuleSimulator } from '@/components/admin/RuleSimulator';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Zap,
  AlertTriangle,
  ChevronRight,
  Layers,
} from 'lucide-react';

export default function PolicyRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([
        fetch('/api/admin/policy-rules'),
        fetch('/api/admin/users'),
      ]);
      const rulesData = await rulesRes.json();
      const usersData = await usersRes.json();
      setRules(rulesData.rules ?? []);
      setUsers(usersData.users ?? []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/policy-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    });
    setRules(prev => prev.map(r => r._id === id ? { ...r, active: !current } : r));
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule? Expenses currently in this approval chain will not be affected.')) return;
    await fetch(`/api/admin/policy-rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r._id !== id));
  }

  const conditionLabel = (rule: any) => {
    if (!rule.conditions?.length) return 'Always matches';
    const parts = rule.conditions.map((c: any) => {
      const opMap: Record<string, string> = { gt: '>', gte: '≥', lt: '<', lte: '≤', eq: '=', neq: '≠', in: 'in' };
      return `${c.field} ${opMap[c.operator] ?? c.operator} ${Array.isArray(c.value) ? c.value.join(', ') : c.value}`;
    });
    return parts.join(` ${rule.conditionLogic} `);
  };

  const stepsLabel = (rule: any) => {
    if (!rule.steps?.length) {
      if (rule.fallbackBehavior === 'AUTO_APPROVE') return 'Auto-approve';
      if (rule.fallbackBehavior === 'BLOCK') return 'Block';
      return 'No steps';
    }
    return `${rule.steps.length} step${rule.steps.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Approval Policies
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rules are evaluated in priority order. First match wins.
              </p>
            </div>
          </div>
        </div>
        <Link href="/admin/policy-rules/new">
          <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/20 active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New rule
          </button>
        </Link>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading rules…</span>
          </div>
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No rules yet</p>
          <p className="text-xs text-muted-foreground max-w-sm text-center mb-4">
            Create your first rule to define who approves expenses. Rules are evaluated in priority order — first match wins.
          </p>
          <Link href="/admin/policy-rules/new">
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Create first rule
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule, i) => (
            <div
              key={rule._id}
              className={`group relative border rounded-2xl p-4 transition-all duration-200 hover:shadow-sm ${
                rule.isDefault
                  ? 'border-primary/30 bg-primary/[0.03]'
                  : rule.active
                  ? 'border-border/50 bg-card/40 hover:border-border'
                  : 'border-border/30 bg-muted/20 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Priority badge */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/50 rounded-md px-1.5 py-0.5 min-w-[28px] text-center">
                    #{rule.priority}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {rule.name}
                    </span>
                    {rule.isDefault && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        DEFAULT
                      </span>
                    )}
                    {!rule.active && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  {rule.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {rule.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {conditionLabel(rule)}
                    </span>
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      {stepsLabel(rule)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/policy-rules/${rule._id}/edit`}>
                    <button
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => toggleActive(rule._id, rule.active)}
                    title={rule.active ? 'Disable' : 'Enable'}
                  >
                    {rule.active ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => deleteRule(rule._id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simulator */}
      {!loading && <RuleSimulator users={users} />}
    </div>
  );
}

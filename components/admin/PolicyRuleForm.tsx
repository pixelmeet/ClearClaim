'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Info,
  Zap,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

const FIELD_LABELS: Record<string, string> = {
  amount:       'Amount (company currency)',
  category:     'Category',
  department:   'Department',
  employeeRole: 'Employee role',
  employeeId:   'Specific employee',
  currency:     'Currency',
};

const CONDITION_FIELD_OPTIONS = Object.entries(FIELD_LABELS).filter(([field]) =>
  !['category', 'department', 'employeeId', 'currency'].includes(field)
);

const OPERATOR_LABELS: Record<string, string> = {
  gt: '>', gte: '≥', lt: '<', lte: '≤', eq: '=', neq: '≠', in: 'is one of',
};

const NUMERIC_FIELDS = ['amount'];

function newCondition() {
  return { field: 'amount', operator: 'gte', value: '' };
}

function newStep(index: number) {
  return {
    stepIndex: index,
    approverType: 'USER',
    approverId: '',
    approverRole: '',
    required: true,
    autoApprove: false,
    label: '',
  };
}

interface PolicyRuleFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  ruleId?: string;
}

export default function PolicyRuleForm({ mode, initialData, ruleId }: PolicyRuleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const [name, setName]                           = useState(initialData?.name ?? '');
  const [description, setDescription]             = useState(initialData?.description ?? '');
  const [priority, setPriority]                   = useState(initialData?.priority ?? 100);
  const [conditionLogic, setConditionLogic]       = useState<'AND' | 'OR'>(initialData?.conditionLogic ?? 'AND');
  const [conditions, setConditions]               = useState(initialData?.conditions?.length ? initialData.conditions : [newCondition()]);
  const [steps, setSteps]                         = useState(initialData?.steps?.length ? initialData.steps : [newStep(0)]);
  const [isDefault, setIsDefault]                 = useState(initialData?.isDefault ?? false);
  const [fallbackBehavior, setFallbackBehavior]   = useState(initialData?.fallbackBehavior ?? 'DEFAULT_FLOW');
  const [minApprovalPercent, setMinApprovalPercent] = useState(initialData?.minApprovalPercent ?? 0);
  const [noConditions, setNoConditions]           = useState(!initialData?.conditions?.length);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .catch(console.error);
  }, []);

  function addCondition() {
    setConditions((prev: any[]) => [...prev, newCondition()]);
  }

  function removeCondition(i: number) {
    setConditions((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));
  }

  function updateCondition(i: number, key: string, value: any) {
    setConditions((prev: any[]) => prev.map((c: any, idx: number) => idx === i ? { ...c, [key]: value } : c));
  }

  function addStep() {
    setSteps((prev: any[]) => [...prev, newStep(prev.length)]);
  }

  function removeStep(i: number) {
    setSteps((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i).map((s: any, idx: number) => ({ ...s, stepIndex: idx })));
  }

  function updateStep(i: number, key: string, value: any) {
    setSteps((prev: any[]) => prev.map((s: any, idx: number) => idx === i ? { ...s, [key]: value } : s));
  }

  async function handleSave() {
    if (!name.trim()) { setError('Rule name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        priority,
        conditionLogic,
        conditions: noConditions ? [] : conditions.filter((c: any) => c.value !== '').map((c: any) => ({
          ...c,
          value: NUMERIC_FIELDS.includes(c.field) ? Number(c.value) : c.value,
        })),
        steps: isDefault && fallbackBehavior === 'AUTO_APPROVE' ? [] : steps.map((s: any) => ({
          ...s,
          approverId:   s.approverType === 'USER' ? (s.approverId || null) : (s.approverType === 'MANAGER' ? (s.approverId || null) : null),
          approverRole: s.approverType === 'ROLE' ? (s.approverRole || null) : null,
        })),
        isDefault,
        fallbackBehavior,
        minApprovalPercent,
        active: true,
      };

      const url = mode === 'edit' ? `/api/admin/policy-rules/${ruleId}` : '/api/admin/policy-rules';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/admin/policy-rules');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full h-9 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
  const selectClass = inputClass;
  const labelClass = "text-xs font-semibold text-foreground mb-1.5 block";

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/policy-rules">
          <button className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            {mode === 'edit' ? 'Edit approval policy' : 'New approval policy'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define when this rule fires and who approves.
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <section className="mb-6">
        <label className={labelClass}>Rule name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. High-value expense approval"
          className={inputClass}
        />
      </section>

      <section className="mb-6">
        <label className={labelClass}>Description (optional)</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="When does this rule apply?"
          className={inputClass}
        />
      </section>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <section>
          <label className={labelClass}>Priority (lower = runs first)</label>
          <input
            type="number"
            min={1}
            max={9999}
            value={priority}
            onChange={e => setPriority(Number(e.target.value))}
            className={inputClass}
          />
        </section>
        <section>
          <label className={labelClass}>Approval threshold</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={minApprovalPercent}
              onChange={e => setMinApprovalPercent(Number(e.target.value))}
              className="w-20 h-9 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-xs text-muted-foreground">% must approve (0 = all)</span>
          </div>
        </section>
      </div>

      {/* Conditions */}
      <section className="mb-6 p-4 border border-border/50 rounded-2xl bg-card/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Conditions</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={noConditions}
                onChange={e => setNoConditions(e.target.checked)}
                className="rounded"
              />
              Always match
            </label>
            {!noConditions && (
              <select
                value={conditionLogic}
                onChange={e => setConditionLogic(e.target.value as any)}
                className="h-7 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
              >
                <option value="AND">ALL match (AND)</option>
                <option value="OR">ANY match (OR)</option>
              </select>
            )}
          </div>
        </div>
        {!noConditions && (
          <>
            <div className="flex flex-col gap-2">
              {conditions.map((c: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={c.field}
                    onChange={e => updateCondition(i, 'field', e.target.value)}
                    className="flex-[2] h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
                  >
                    {CONDITION_FIELD_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={c.operator}
                    onChange={e => updateCondition(i, 'operator', e.target.value)}
                    className="flex-1 h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
                  >
                    {Object.entries(OPERATOR_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <input
                    value={c.value}
                    onChange={e => updateCondition(i, 'value', e.target.value)}
                    placeholder={NUMERIC_FIELDS.includes(c.field) ? '50000' : 'value'}
                    type={NUMERIC_FIELDS.includes(c.field) ? 'number' : 'text'}
                    className="flex-[2] h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => removeCondition(i)}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addCondition}
              className="flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </button>
          </>
        )}
      </section>

      {/* Steps */}
      <section className="mb-6 p-4 border border-border/50 rounded-2xl bg-card/30">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Approval steps</span>
        </div>
        <div className="flex flex-col gap-3">
          {steps.map((s: any, i: number) => (
            <div key={i} className="border border-border/40 rounded-xl p-3 bg-background/50">
              <div className="flex gap-2 items-center mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab flex-shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground min-w-[50px]">
                  Step {i + 1}
                </span>
                <select
                  value={s.approverType}
                  onChange={e => updateStep(i, 'approverType', e.target.value)}
                  className="flex-1 h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="USER">Specific user</option>
                  <option value="ROLE">Any user with role</option>
                  <option value="MANAGER">Employee&apos;s manager</option>
                </select>
                {s.approverType === 'USER' && (
                  <select
                    value={s.approverId}
                    onChange={e => updateStep(i, 'approverId', e.target.value)}
                    className="flex-[2] h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
                  >
                    <option value="">Select user…</option>
                    {users.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                )}
                {s.approverType === 'ROLE' && (
                  <select
                    value={s.approverRole}
                    onChange={e => updateStep(i, 'approverRole', e.target.value)}
                    className="flex-[2] h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
                  >
                    <option value="">Select role…</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}
                {s.approverType === 'MANAGER' && (
                  <span className="flex-[2] text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Resolved at submission time
                  </span>
                )}
                <button
                  onClick={() => removeStep(i)}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-4 ml-9 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={s.required}
                    onChange={e => updateStep(i, 'required', e.target.checked)}
                    className="rounded"
                  />
                  Required
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={s.autoApprove}
                    onChange={e => updateStep(i, 'autoApprove', e.target.checked)}
                    className="rounded"
                  />
                  Auto-approve
                </label>
                <input
                  value={s.label}
                  onChange={e => updateStep(i, 'label', e.target.value)}
                  placeholder="Step label (optional)"
                  className="flex-1 h-7 rounded-md border border-border/40 bg-background px-2 text-xs focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addStep}
          className="flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add step
        </button>
      </section>

      {/* Default rule settings */}
      <section className="mb-6 p-4 border border-border/50 rounded-2xl bg-card/30">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={e => setIsDefault(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-semibold text-foreground">Set as default rule</span>
        </label>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          Runs when no other rule matches. Only one default rule allowed per company.
        </p>
        {isDefault && (
          <div className="mt-3 ml-6">
            <label className="text-xs font-semibold text-foreground mb-1 block">
              When no rule matches:
            </label>
            <select
              value={fallbackBehavior}
              onChange={e => setFallbackBehavior(e.target.value)}
              className="h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none"
            >
              <option value="DEFAULT_FLOW">Use this rule&apos;s steps</option>
              <option value="AUTO_APPROVE">Auto-approve (no approval needed)</option>
              <option value="BLOCK">Block (reject immediately)</option>
            </select>
          </div>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md hover:shadow-primary/20 active:scale-[0.98]"
        >
          {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create rule'}
        </button>
        <Link href="/admin/policy-rules">
          <button className="h-10 px-6 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            Cancel
          </button>
        </Link>
      </div>
    </div>
  );
}

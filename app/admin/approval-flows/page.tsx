'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    GitBranch,
    Trash2,
    ArrowUp,
    ArrowDown,
    Zap,
    Shield,
    User as UserIcon,
    Users,
    ToggleLeft,
    ToggleRight,
    Loader2,
    CheckCircle2,
    XCircle,
    Info,
    ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole, ExpenseCategory, StepType } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────
interface CompanyUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface StepConfig {
    id: string; // client-only id for key
    type: StepType;
    userId?: string;
    role?: UserRole;
    required: boolean;
    autoApprove: boolean;
}

interface FlowFormData {
    name: string;
    isManagerApprover: boolean;
    minApprovalPercent: number;
    category: ExpenseCategory | null;
    steps: StepConfig[];
}

interface ExistingFlow {
    _id: string;
    name: string;
    isManagerApprover: boolean;
    minApprovalPercent: number;
    category: ExpenseCategory | null;
    steps: Array<{
        type: StepType;
        userId?: { _id: string; name: string; email: string } | string;
        role?: UserRole;
        required?: boolean;
        autoApprove?: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────
function uid() {
    return Math.random().toString(36).slice(2, 10);
}

const CATEGORIES = Object.values(ExpenseCategory);
const ROLES = Object.values(UserRole);

const emptyStep = (): StepConfig => ({
    id: uid(),
    type: StepType.USER,
    userId: '',
    role: undefined,
    required: false,
    autoApprove: false,
});

// ─── Main Page ─────────────────────────────────────────────
export default function ApprovalFlowsPage() {
    const router = useRouter();
    const [flows, setFlows] = useState<ExistingFlow[]>([]);
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [editingFlow, setEditingFlow] = useState<ExistingFlow | null>(null);

    // ── Fetch data ─────────────────────────────────────────
    const fetchFlows = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/approval-flows');
            if (res.ok) {
                const data = await res.json();
                setFlows(data.flows || []);
            }
        } catch (e) {
            console.error('Failed to load flows', e);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/users/list');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            console.error('Failed to load users', e);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchFlows(), fetchUsers()]).finally(() => setLoading(false));
    }, [fetchFlows, fetchUsers]);

    // ── Handlers ───────────────────────────────────────────
    const handleCreateSuccess = () => {
        setView('list');
        setEditingFlow(null);
        fetchFlows();
    };

    const handleEdit = (flow: ExistingFlow) => {
        setEditingFlow(flow);
        setView('edit');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this approval flow? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/approval-flows/${id}`, { method: 'DELETE' });
            if (res.ok) fetchFlows();
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    // ── Loading state ──────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Create / Edit view ─────────────────────────────────
    if (view === 'create' || view === 'edit') {
        return (
            <div className="p-4 md:p-8 lg:px-10 max-w-[900px] mx-auto">
                <FlowBuilderForm
                    users={users}
                    existingFlow={view === 'edit' ? editingFlow : null}
                    onSuccess={handleCreateSuccess}
                    onCancel={() => { setView('list'); setEditingFlow(null); }}
                />
            </div>
        );
    }

    // ── List view ──────────────────────────────────────────
    return (
        <div className="space-y-8 p-4 md:p-8 lg:px-10 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)]">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] rounded-full bg-accent/10 blur-[120px] mix-blend-screen" />
            </div>

            {/* Header */}
            <div className="opacity-0 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div>
                    <h1 className="text-3xl md:text-5xl font-display font-semibold tracking-tight text-foreground">
                        Approval Flows
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base md:text-lg">
                        Define structured approval workflows for your organization.
                    </p>
                </div>
                <Button
                    onClick={() => setView('create')}
                    className="rounded-xl gap-2 h-11 px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md shadow-primary/20 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    New Flow
                </Button>
            </div>

            {/* Flows Grid */}
            {flows.length === 0 ? (
                <div className="opacity-0 animate-fade-in-up delay-200">
                    <div className="glass-panel rounded-[24px] p-12 text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <GitBranch className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Approval Flows Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Create your first approval flow to define how expenses get reviewed and approved in your organization.
                        </p>
                        <Button
                            onClick={() => setView('create')}
                            className="rounded-xl gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create First Flow
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {flows.map((flow, i) => (
                        <div
                            key={flow._id}
                            className="opacity-0 animate-fade-in-up group"
                            style={{ animationDelay: `${(i + 1) * 100}ms` }}
                        >
                            <div className="glass-panel relative overflow-hidden rounded-[20px] p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 h-full group-hover:-translate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-primary/10">
                                                <GitBranch className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{flow.name}</h3>
                                                {flow.category && (
                                                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                                        {flow.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-2 rounded-xl bg-muted/30">
                                            <div className="text-lg font-bold tabular-nums">{flow.steps.length}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Steps</div>
                                        </div>
                                        <div className="text-center p-2 rounded-xl bg-muted/30">
                                            <div className="text-lg font-bold tabular-nums">{flow.minApprovalPercent}%</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Min %</div>
                                        </div>
                                        <div className="text-center p-2 rounded-xl bg-muted/30">
                                            <div className="text-lg font-bold">
                                                {flow.isManagerApprover ? (
                                                    <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Manager</div>
                                        </div>
                                    </div>

                                    {/* Step pills */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {flow.steps.map((step, si) => (
                                            <span
                                                key={si}
                                                className={cn(
                                                    'text-xs px-2 py-1 rounded-lg font-medium',
                                                    step.type === StepType.USER
                                                        ? 'bg-blue-500/10 text-blue-400'
                                                        : 'bg-purple-500/10 text-purple-400'
                                                )}
                                            >
                                                {step.type === StepType.USER
                                                    ? typeof step.userId === 'object' && step.userId
                                                        ? (step.userId as any).name
                                                        : 'User'
                                                    : step.role || 'Role'}
                                                {step.required && ' ✦'}
                                                {step.autoApprove && ' ⚡'}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 rounded-xl text-xs"
                                            onClick={() => handleEdit(flow)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(flow._id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Flow Builder Form ─────────────────────────────────────
function FlowBuilderForm({
    users,
    existingFlow,
    onSuccess,
    onCancel,
}: {
    users: CompanyUser[];
    existingFlow: ExistingFlow | null;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const isEdit = !!existingFlow;

    // Initialize form from existing flow or defaults
    const [form, setForm] = useState<FlowFormData>(() => {
        if (existingFlow) {
            return {
                name: existingFlow.name,
                isManagerApprover: existingFlow.isManagerApprover,
                minApprovalPercent: existingFlow.minApprovalPercent,
                category: existingFlow.category,
                steps: existingFlow.steps.map((s) => ({
                    id: uid(),
                    type: s.type,
                    userId: typeof s.userId === 'object' && s.userId ? s.userId._id : (s.userId as string) || '',
                    role: s.role,
                    required: s.required ?? false,
                    autoApprove: s.autoApprove ?? false,
                })),
            };
        }
        return {
            name: '',
            isManagerApprover: true,
            minApprovalPercent: 100,
            category: null,
            steps: [emptyStep()],
        };
    });

    const [errors, setErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // ── Step management ────────────────────────────────────
    const addStep = () => {
        setForm((prev) => ({ ...prev, steps: [...prev.steps, emptyStep()] }));
    };

    const removeStep = (idx: number) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== idx),
        }));
    };

    const moveStep = (idx: number, direction: 'up' | 'down') => {
        setForm((prev) => {
            const steps = [...prev.steps];
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= steps.length) return prev;
            [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
            return { ...prev, steps };
        });
    };

    const updateStep = (idx: number, updates: Partial<StepConfig>) => {
        setForm((prev) => {
            const steps = [...prev.steps];
            steps[idx] = { ...steps[idx], ...updates };

            // Enforce mutual exclusion
            if (updates.required && steps[idx].autoApprove) {
                steps[idx].autoApprove = false;
            }
            if (updates.autoApprove && steps[idx].required) {
                steps[idx].required = false;
            }

            // Clear irrelevant field when type changes
            if (updates.type === StepType.USER) {
                steps[idx].role = undefined;
            }
            if (updates.type === StepType.ROLE) {
                steps[idx].userId = '';
            }

            return { ...prev, steps };
        });
    };

    // ── Client-side validation ─────────────────────────────
    const validate = (): string[] => {
        const errs: string[] = [];

        if (!form.name.trim()) errs.push('Flow name is required');
        if (form.steps.length === 0) errs.push('At least one step is required');

        const userIds = new Set<string>();
        form.steps.forEach((step, i) => {
            if (step.type === StepType.USER && !step.userId) {
                errs.push(`Step ${i + 1}: Select a user`);
            }
            if (step.type === StepType.ROLE && !step.role) {
                errs.push(`Step ${i + 1}: Select a role`);
            }
            if (step.required && step.autoApprove) {
                errs.push(`Step ${i + 1}: Cannot be both Required and AutoApprove`);
            }
            if (step.type === StepType.USER && step.userId) {
                if (userIds.has(step.userId)) {
                    errs.push(`Step ${i + 1}: Duplicate approver`);
                }
                userIds.add(step.userId);
            }
        });

        const allRequired = form.steps.every((s) => s.required);
        if (allRequired && form.minApprovalPercent < 100) {
            errs.push('When all steps are required, minimum approval % must be 100');
        }

        return errs;
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async () => {
        const validationErrors = validate();
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors([]);
        setSubmitting(true);

        const payload = {
            name: form.name.trim(),
            isManagerApprover: form.isManagerApprover,
            minApprovalPercent: form.minApprovalPercent,
            category: form.category || null,
            steps: form.steps.map((s) => ({
                type: s.type,
                ...(s.type === StepType.USER ? { userId: s.userId } : { role: s.role }),
                required: s.required,
                autoApprove: s.autoApprove,
            })),
        };

        try {
            const url = isEdit
                ? `/api/admin/approval-flows/${existingFlow!._id}`
                : '/api/admin/approval-flows';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors(data.details || [data.error || 'Failed to save flow']);
                return;
            }

            setSubmitted(true);
            setTimeout(onSuccess, 600);
        } catch (e) {
            setErrors(['Network error. Please try again.']);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="opacity-0 animate-fade-in-up">
                <button
                    onClick={onCancel}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
                >
                    ← Back to Flows
                </button>
                <h1 className="text-2xl md:text-4xl font-display font-semibold tracking-tight text-foreground">
                    {isEdit ? 'Edit Flow' : 'Create Approval Flow'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isEdit ? 'Modify the approval workflow configuration.' : 'Define a new structured approval workflow.'}
                </p>
            </div>

            {/* Success Banner */}
            {submitted && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/20 text-success">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">
                        Flow {isEdit ? 'updated' : 'created'} successfully!
                    </span>
                </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <div className="opacity-0 animate-fade-in-up p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-destructive mb-1">Validation Errors</p>
                            <ul className="list-disc list-inside text-sm text-destructive/90 space-y-0.5">
                                {errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Section 1: Basic Info ──────────────────── */}
            <div className="opacity-0 animate-fade-in-up delay-100 glass-panel rounded-[20px] p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Info className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    {/* Flow Name */}
                    <div className="space-y-2">
                        <Label htmlFor="flowName">Flow Name</Label>
                        <Input
                            id="flowName"
                            placeholder="e.g. Default Approval"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="rounded-xl h-11"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Category (Optional)</Label>
                        <div className="relative">
                            <select
                                value={form.category ?? ''}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        category: e.target.value ? (e.target.value as ExpenseCategory) : null,
                                    }))
                                }
                                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">All Categories (Default)</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Manager Toggle */}
                    <div className="space-y-2">
                        <Label>Manager First Approval</Label>
                        <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, isManagerApprover: !prev.isManagerApprover }))}
                            className={cn(
                                'flex items-center gap-3 w-full h-11 px-4 rounded-xl border transition-all text-sm',
                                form.isManagerApprover
                                    ? 'border-primary/30 bg-primary/5 text-primary'
                                    : 'border-border bg-background text-muted-foreground hover:border-border/60'
                            )}
                        >
                            {form.isManagerApprover ? (
                                <ToggleRight className="h-5 w-5" />
                            ) : (
                                <ToggleLeft className="h-5 w-5" />
                            )}
                            <span className="font-medium">
                                {form.isManagerApprover ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                Manager reviews first
                            </span>
                        </button>
                    </div>

                    {/* Min Approval % */}
                    <div className="space-y-2">
                        <Label htmlFor="minPercent">Minimum Approval %</Label>
                        <div className="relative">
                            <Input
                                id="minPercent"
                                type="number"
                                min={0}
                                max={100}
                                value={form.minApprovalPercent}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        minApprovalPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                    }))
                                }
                                className="rounded-xl h-11 pr-10"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Steps Builder ───────────────── */}
            <div className="opacity-0 animate-fade-in-up delay-200 glass-panel rounded-[20px] p-6 space-y-5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-accent/10">
                            <Users className="h-4 w-4 text-accent" />
                        </div>
                        <h2 className="text-lg font-semibold">Approval Steps</h2>
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full ml-2">
                            {form.steps.length} step{form.steps.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addStep}
                        className="rounded-xl gap-1.5 text-xs"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Step
                    </Button>
                </div>

                {/* Manager step indicator */}
                {form.isManagerApprover && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                        <Shield className="h-4 w-4 shrink-0" />
                        <span>Step 0 (auto): Employee&apos;s manager reviews first</span>
                    </div>
                )}

                {/* Steps */}
                <div className="space-y-4">
                    {form.steps.map((step, idx) => (
                        <StepCard
                            key={step.id}
                            step={step}
                            index={idx}
                            total={form.steps.length}
                            users={users}
                            onUpdate={(updates) => updateStep(idx, updates)}
                            onRemove={() => removeStep(idx)}
                            onMove={(dir) => moveStep(idx, dir)}
                        />
                    ))}
                </div>

                {form.steps.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm mb-3">No steps defined. Add at least one.</p>
                        <Button variant="outline" size="sm" onClick={addStep} className="rounded-xl gap-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            Add Step
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Actions ─────────────────────────────────── */}
            <div className="opacity-0 animate-fade-in-up delay-300 flex items-center gap-3 justify-end pb-8">
                <Button variant="ghost" onClick={onCancel} className="rounded-xl">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || submitted}
                    className="rounded-xl gap-2 h-11 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md shadow-primary/20 transition-all"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                        </>
                    ) : submitted ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Saved!
                        </>
                    ) : (
                        <>
                            {isEdit ? 'Update Flow' : 'Create Flow'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

// ─── Step Card Component ───────────────────────────────────
function StepCard({
    step,
    index,
    total,
    users,
    onUpdate,
    onRemove,
    onMove,
}: {
    step: StepConfig;
    index: number;
    total: number;
    users: CompanyUser[];
    onUpdate: (updates: Partial<StepConfig>) => void;
    onRemove: () => void;
    onMove: (dir: 'up' | 'down') => void;
}) {
    return (
        <div className="group relative rounded-2xl border border-border/50 bg-card/30 p-5 transition-all hover:border-border/80 hover:bg-card/50">
            {/* Step number badge */}
            <div className="absolute -top-3 left-4 px-2.5 py-0.5 text-xs font-bold rounded-lg bg-primary/10 text-primary border border-primary/20">
                Step {index + 1}
            </div>

            <div className="flex flex-col gap-4 pt-1">
                {/* Row 1: Type selector + User/Role selector */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Type */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onUpdate({ type: StepType.USER })}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all',
                                    step.type === StepType.USER
                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                        : 'border-border text-muted-foreground hover:border-border/60'
                                )}
                            >
                                <UserIcon className="h-3.5 w-3.5" />
                                User
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdate({ type: StepType.ROLE })}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all',
                                    step.type === StepType.ROLE
                                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                                        : 'border-border text-muted-foreground hover:border-border/60'
                                )}
                            >
                                <Users className="h-3.5 w-3.5" />
                                Role
                            </button>
                        </div>
                    </div>

                    {/* User / Role Selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            {step.type === StepType.USER ? 'Select User' : 'Select Role'}
                        </Label>
                        <div className="relative">
                            {step.type === StepType.USER ? (
                                <select
                                    value={step.userId || ''}
                                    onChange={(e) => onUpdate({ userId: e.target.value })}
                                    className="w-full h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                >
                                    <option value="">Choose approver…</option>
                                    {users.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.email}) — {u.role}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value={step.role || ''}
                                    onChange={(e) => onUpdate({ role: e.target.value as UserRole })}
                                    className="w-full h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                >
                                    <option value="">Choose role…</option>
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            )}
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Row 2: Toggles + Actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                        {/* Required toggle */}
                        <button
                            type="button"
                            onClick={() => onUpdate({ required: !step.required })}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                                step.required
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                    : 'border-border text-muted-foreground hover:border-border/60'
                            )}
                            title={step.autoApprove ? 'Cannot enable when AutoApprove is on' : 'Mark as required step'}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Required
                        </button>

                        {/* AutoApprove toggle */}
                        <button
                            type="button"
                            onClick={() => onUpdate({ autoApprove: !step.autoApprove })}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                                step.autoApprove
                                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                                    : 'border-border text-muted-foreground hover:border-border/60'
                            )}
                            title={step.required ? 'Cannot enable when Required is on' : 'Auto-approve this step'}
                        >
                            <Zap className="h-3.5 w-3.5" />
                            AutoApprove
                        </button>
                    </div>

                    {/* Move + Delete */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onMove('up')}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                        >
                            <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onMove('down')}
                            disabled={index === total - 1}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                        >
                            <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                            title="Remove step"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Users,
    FileText,
    UserCheck,
    Loader2,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface ApproverFormData {
    user: string;
    required: boolean;
    sequenceNo: number;
    autoApprove: boolean;
}

export interface ApprovalRuleFormData {
    ruleName: string;
    description: string;
    appliesToUser: string;
    manager: string;
    isManagerApprover: boolean;
    approverSequence: boolean;
    minApprovalPercent: number;
    approvers: ApproverFormData[];
}

interface UserOption {
    _id: string;
    name: string;
    email: string;
    role?: string;
}

interface AdminApprovalRuleFormProps {
    currentUserOrganization?: string;
    editMode?: boolean;
    ruleId?: string;
    initialData?: ApprovalRuleFormData;
}

// ────────────────────────────────────────────────────────────
// Steps config
// ────────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Basic Information', icon: FileText },
    { label: 'User Assignment', icon: UserCheck },
    { label: 'Approvers', icon: Users },
];

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function AdminApprovalRuleForm({
    currentUserOrganization,
    editMode = false,
    ruleId,
    initialData,
}: AdminApprovalRuleFormProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Users data
    const [allUsers, setAllUsers] = useState<UserOption[]>([]);
    const [employees, setEmployees] = useState<UserOption[]>([]);
    const [managers, setManagers] = useState<UserOption[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors },
    } = useForm<ApprovalRuleFormData>({
        defaultValues: {
            ruleName: '',
            description: '',
            appliesToUser: '',
            manager: '',
            isManagerApprover: false,
            approverSequence: false,
            minApprovalPercent: 100,
            approvers: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'approvers',
    });

    const watchApproverSequence = watch('approverSequence');
    const watchRuleName = watch('ruleName');
    const watchMinApproval = watch('minApprovalPercent');
    const watchAppliesToUser = watch('appliesToUser');
    const watchManager = watch('manager');

    // ────────────────────────────────────────────────────────
    // Fetch users
    // ────────────────────────────────────────────────────────

    const fetchUsers = useCallback(async () => {
        if (!currentUserOrganization) return;
        try {
            const [allRes, empRes, mgrRes] = await Promise.all([
                fetch(`/api/admin/users?organization=${currentUserOrganization}`),
                fetch(`/api/admin/users?organization=${currentUserOrganization}&role=EMPLOYEE`),
                fetch(`/api/admin/users?organization=${currentUserOrganization}&role=MANAGER`),
            ]);

            const allData = await allRes.json();
            const empData = await empRes.json();
            const mgrData = await mgrRes.json();

            if (allRes.ok) setAllUsers(allData.users || []);
            if (empRes.ok) setEmployees(empData.users || []);
            if (mgrRes.ok) setManagers(mgrData.users || []);
        } catch {
            console.error('Failed to fetch users');
        }
    }, [currentUserOrganization]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ────────────────────────────────────────────────────────
    // Pre-populate in edit mode
    // ────────────────────────────────────────────────────────

    useEffect(() => {
        if (editMode && initialData) {
            setValue('ruleName', initialData.ruleName);
            setValue('description', initialData.description);
            setValue('appliesToUser', initialData.appliesToUser);
            setValue('manager', initialData.manager);
            setValue('isManagerApprover', initialData.isManagerApprover);
            setValue('approverSequence', initialData.approverSequence);
            setValue('minApprovalPercent', initialData.minApprovalPercent);

            // Clear existing field array entries and append new ones
            while (fields.length > 0) {
                remove(0);
            }
            initialData.approvers.forEach((approver) => {
                append(approver);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, initialData]);

    // ────────────────────────────────────────────────────────
    // Step validation
    // ────────────────────────────────────────────────────────

    const isStepValid = (s: number): boolean => {
        switch (s) {
            case 0:
                return !!watchRuleName?.trim() && watchMinApproval !== undefined && watchMinApproval !== null;
            case 1:
                return !!watchAppliesToUser && !!watchManager;
            case 2:
                return fields.length > 0;
            default:
                return false;
        }
    };

    const canProceed = isStepValid(step);

    // ────────────────────────────────────────────────────────
    // Submit
    // ────────────────────────────────────────────────────────

    const onSubmit = async (data: ApprovalRuleFormData) => {
        setSubmitting(true);
        setMessage(null);

        try {
            const url = editMode
                ? `/api/approval-rules/${ruleId}`
                : '/api/approval-rules';

            const method = editMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    organization: currentUserOrganization,
                }),
            });

            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: editMode
                        ? 'Approval rule updated successfully!'
                        : 'Approval rule created successfully!',
                });
                setTimeout(() => {
                    router.push('/admin/approvals');
                }, 1500);
            } else {
                const errorData = await res.json();
                setMessage({
                    type: 'error',
                    text: errorData.error || 'Failed to save approval rule.',
                });
            }
        } catch {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSubmitting(false);
        }
    };

    // ────────────────────────────────────────────────────────
    // Step Indicator
    // ────────────────────────────────────────────────────────

    const StepIndicator = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {STEPS.map((s, i) => {
                    const StepIcon = s.icon;
                    const isCompleted = i < step;
                    const isCurrent = i === step;

                    return (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className={`
                                        flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                                        ${isCompleted
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : isCurrent
                                                ? 'border-primary text-primary bg-primary/10'
                                                : 'border-muted-foreground/30 text-muted-foreground/50'
                                        }
                                    `}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <StepIcon className="h-4 w-4" />
                                    )}
                                </div>
                                <span
                                    className={`text-xs font-medium text-center ${isCurrent ? 'text-primary' : 'text-muted-foreground'
                                        }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="flex-1 mx-4 mt-[-1.5rem]">
                                    <div
                                        className={`h-0.5 transition-all duration-500 ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                                            }`}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ────────────────────────────────────────────────────────
    // Render Steps
    // ────────────────────────────────────────────────────────

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ruleName">
                                    Rule Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="ruleName"
                                    placeholder="e.g. Finance Team Approval"
                                    {...register('ruleName', { required: true })}
                                />
                                {errors.ruleName && (
                                    <p className="text-sm text-destructive">Rule name is required</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minApprovalPercent">
                                    Minimum Approval Percentage
                                </Label>
                                <Input
                                    id="minApprovalPercent"
                                    type="number"
                                    min={0}
                                    max={100}
                                    {...register('minApprovalPercent', {
                                        valueAsNumber: true,
                                        min: 0,
                                        max: 100,
                                    })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this approval rule does..."
                                rows={3}
                                {...register('description')}
                            />
                        </div>

                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="isManagerApprover"
                                    checked={watch('isManagerApprover')}
                                    onCheckedChange={(checked) =>
                                        setValue('isManagerApprover', !!checked)
                                    }
                                />
                                <Label htmlFor="isManagerApprover" className="cursor-pointer">
                                    Manager is Approver
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="approverSequence"
                                    checked={watch('approverSequence')}
                                    onCheckedChange={(checked) =>
                                        setValue('approverSequence', !!checked)
                                    }
                                />
                                <Label htmlFor="approverSequence" className="cursor-pointer">
                                    Sequential Approval
                                </Label>
                            </div>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>
                                Applies To User <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={watch('appliesToUser')}
                                onValueChange={(val) => setValue('appliesToUser', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((user) => (
                                        <SelectItem key={user._id} value={user._id}>
                                            {user.name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Manager <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={watch('manager')}
                                onValueChange={(val) => setValue('manager', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select manager..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {managers.map((user) => (
                                        <SelectItem key={user._id} value={user._id}>
                                            {user.name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        {fields.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Users className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground mb-4">
                                        No approvers added yet. Add your first approver to get started.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() =>
                                            append({
                                                user: '',
                                                required: false,
                                                sequenceNo: fields.length,
                                                autoApprove: false,
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add First Approver
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() =>
                                            append({
                                                user: '',
                                                required: false,
                                                sequenceNo: fields.length,
                                                autoApprove: false,
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Approver
                                    </Button>
                                </div>

                                <Accordion type="multiple" className="space-y-2">
                                    {fields.map((field, index) => {
                                        const approverUser = allUsers.find(
                                            (u) => u._id === watch(`approvers.${index}.user`)
                                        );

                                        return (
                                            <AccordionItem
                                                key={field.id}
                                                value={field.id}
                                                className="border rounded-lg px-4 bg-card/40"
                                            >
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="h-6 w-6 p-0 justify-center text-xs">
                                                            {index + 1}
                                                        </Badge>
                                                        <span className="font-medium">
                                                            {approverUser?.name || `Approver ${index + 1}`}
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-4 pt-2">
                                                    <div className="space-y-2">
                                                        <Label>Approver</Label>
                                                        <Select
                                                            value={watch(`approvers.${index}.user`)}
                                                            onValueChange={(val) =>
                                                                setValue(`approvers.${index}.user`, val)
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select user..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {allUsers.map((user) => (
                                                                    <SelectItem
                                                                        key={user._id}
                                                                        value={user._id}
                                                                    >
                                                                        {user.name} ({user.email})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {watchApproverSequence && (
                                                        <div className="space-y-2">
                                                            <Label>Sequence Number</Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                {...register(
                                                                    `approvers.${index}.sequenceNo`,
                                                                    { valueAsNumber: true }
                                                                )}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`approver-required-${index}`}
                                                                checked={watch(
                                                                    `approvers.${index}.required`
                                                                )}
                                                                onCheckedChange={(checked) =>
                                                                    setValue(
                                                                        `approvers.${index}.required`,
                                                                        !!checked
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`approver-required-${index}`}
                                                                className="cursor-pointer text-sm"
                                                            >
                                                                Required Approval
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`approver-auto-${index}`}
                                                                checked={watch(
                                                                    `approvers.${index}.autoApprove`
                                                                )}
                                                                onCheckedChange={(checked) =>
                                                                    setValue(
                                                                        `approvers.${index}.autoApprove`,
                                                                        !!checked
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`approver-auto-${index}`}
                                                                className="cursor-pointer text-sm"
                                                            >
                                                                Auto Approve
                                                            </Label>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="gap-1.5"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Remove
                                                    </Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // ────────────────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────────────────

    return (
        <Card className="border-card-border bg-card/60 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-2xl">
                    {editMode ? 'Edit Approval Rule' : 'Create Approval Rule'}
                </CardTitle>
                <CardDescription>
                    {editMode
                        ? 'Update the approval rule settings below.'
                        : 'Fill in the details below to create a new approval rule.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <StepIndicator />

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="min-h-[280px]">{renderStep()}</div>

                    {/* Message feedback */}
                    {message && (
                        <div
                            className={`mt-4 rounded-lg p-3 text-sm ${message.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            disabled={step === 0}
                            onClick={() => setStep((s) => s - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {step < STEPS.length - 1 ? (
                            <Button
                                type="button"
                                className="gap-2"
                                disabled={!canProceed}
                                onClick={() => setStep((s) => s + 1)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="gap-2"
                                disabled={!canProceed || submitting}
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editMode ? 'Update Rule' : 'Create Rule'}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

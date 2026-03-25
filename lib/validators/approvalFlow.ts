'use strict';

import { z } from 'zod';
import { ExpenseCategory, StepType, UserRole } from '@/lib/types';

// ─── Individual Step Schema ────────────────────────────────
const approvalStepSchema = z
    .object({
        type: z.enum([StepType.USER, StepType.ROLE]),
        userId: z.string().min(1, 'userId is required for USER steps').optional(),
        role: z.nativeEnum(UserRole).optional(),
        required: z.boolean().default(false),
        autoApprove: z.boolean().default(false),
    })
    .strict()
    .superRefine((step, ctx) => {
        // USER step must have userId
        if (step.type === StepType.USER && !step.userId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'USER step must specify a userId.',
                path: ['userId'],
            });
        }
        // ROLE step must have role
        if (step.type === StepType.ROLE && !step.role) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'ROLE step must specify a role.',
                path: ['role'],
            });
        }
        // required + autoApprove is logically invalid
        if (step.required && step.autoApprove) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'A step cannot be both required and autoApprove.',
                path: ['autoApprove'],
            });
        }
    });

// ─── Full Flow Schema ──────────────────────────────────────
export const createApprovalFlowSchema = z
    .object({
        name: z.string().trim().min(1, 'Flow name is required').max(100),
        isManagerApprover: z.boolean().default(true),
        minApprovalPercent: z.number().min(0).max(100).default(100),
        category: z.nativeEnum(ExpenseCategory).nullable().optional(),
        steps: z
            .array(approvalStepSchema)
            .min(1, 'At least one approval step is required'),
    })
    .strict()
    .superRefine((flow, ctx) => {
        // Check for duplicate userId in steps
        const userIds = flow.steps
            .filter((s) => s.type === StepType.USER && s.userId)
            .map((s) => s.userId!);
        const seen = new Set<string>();
        for (let i = 0; i < userIds.length; i++) {
            if (seen.has(userIds[i])) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Duplicate approver: user ${userIds[i]} appears more than once.`,
                    path: ['steps'],
                });
            }
            seen.add(userIds[i]);
        }

        // If ALL steps are required, minApprovalPercent must be 100
        const allRequired = flow.steps.every((s) => s.required);
        if (allRequired && flow.minApprovalPercent < 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    'When all steps are required, minApprovalPercent must be 100.',
                path: ['minApprovalPercent'],
            });
        }
    });

// ─── Update schema (same rules, partial optional for PATCH-like updates) ─
export const updateApprovalFlowSchema = createApprovalFlowSchema;

// ─── Types ─────────────────────────────────────────────────
export type CreateApprovalFlowInput = z.infer<typeof createApprovalFlowSchema>;
export type ApprovalStepInput = z.infer<typeof approvalStepSchema>;

/**
 * Validate flow input and return parsed data or formatted errors.
 */
export function validateApprovalFlow(data: unknown): {
    success: boolean;
    data?: CreateApprovalFlowInput;
    errors?: string[];
} {
    const result = createApprovalFlowSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { success: false, errors };
}

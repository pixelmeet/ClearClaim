import { z } from 'zod';
import { UserRole, ExpenseCategory, StepType, ActionType } from '@/lib/types';

// Helper for ObjectId validation (basic string check for now, can be regex)
const objectId = z.string().min(24, 'Invalid ID format');

// --- Auth Schemas ---

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const SignupSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    companyName: z.string().min(2, 'Company name must be at least 2 characters').transform((v) => v.trim()),
    country: z.string().min(2, 'Country is required'),
    inviteCode: z.string().optional(),
});

// --- Company ---
export const CompanySchema = z.object({
    name: z.string().min(1),
    country: z.string().min(1),
    defaultCurrency: z.string().length(3),
});

export const UpdateCompanySchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    country: z.string().min(2, "Country is required"),
    defaultCurrency: z.string().length(3, "Currency must be a 3-letter code"),
    address: z.string().optional(),
    branches: z.string().optional(),
    website: z.string().url("Invalid URL format").optional().or(z.literal('')),
    taxId: z.string().optional(),
    contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
    contactPhone: z.string().optional(),
});

// --- User ---
export const CreateUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6).or(z.literal('')).optional(), // Optional if auto-generated or invite flow
    role: z.nativeEnum(UserRole),
    managerId: objectId.or(z.literal('')).or(z.literal('none')).optional().nullable(),
});

export const AdminCreateUserSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    role: z.nativeEnum(UserRole),
    managerId: objectId.or(z.literal('')).or(z.literal('none')).optional().nullable(),
});

export const AdminUpdateUserSchema = z.object({
    name: z.string().min(2, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z.nativeEnum(UserRole).optional(),
    managerId: objectId.or(z.literal('')).or(z.literal('none')).optional().nullable(),
    isDisabled: z.boolean().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// --- Expense ---
export const CreateExpenseSchema = z.object({
    amountOriginal: z.number().positive(),
    currencyOriginal: z.string().length(3),
    category: z.nativeEnum(ExpenseCategory),
    description: z.string().min(5),
    expenseDate: z.string().or(z.date()), // API might send string
    receiptUrl: z.string().nullable().optional(),
});

export const UpdateExpenseSchema = z.object({
    description: z.string().min(1).optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    expenseDate: z.string().or(z.date()).optional(),
    receiptUrl: z.string().nullable().optional(),
});

// --- Approval Flow ---
export const ApprovalStepSchema = z.object({
    type: z.nativeEnum(StepType),
    role: z.nativeEnum(UserRole).optional(),
    userId: objectId.optional(),
    required: z.boolean().optional(),
    autoApprove: z.boolean().optional(),
});

export const CreateApprovalFlowSchema = z.object({
    name: z.string().min(3),
    isManagerApprover: z.boolean(),
    minApprovalPercent: z.number().min(0).max(100).optional(),
    steps: z.array(ApprovalStepSchema),
});

// --- Approval Action ---
export const ProcessApprovalSchema = z.object({
    expenseId: objectId,
    action: z.enum([ActionType.APPROVE, ActionType.REJECT]),
    comment: z.string().optional(),
}).strict();

export const OverrideApprovalSchema = z.object({
    expenseId: objectId,
    action: z.enum([ActionType.OVERRIDE_APPROVE, ActionType.OVERRIDE_REJECT]),
    comment: z.string().min(5, 'Reason is required for overrides'),
}).strict();

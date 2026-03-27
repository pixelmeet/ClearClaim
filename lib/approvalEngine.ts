import User, { IUser, UserRole } from '@/models/User';
import Expense, { IExpense, ExpenseStatus, IChainStep } from '@/models/Expense';
import ApprovalFlow, { IApprovalFlow, StepType } from '@/models/ApprovalFlow';
import ThresholdRule, { IThresholdRule } from '@/models/ThresholdRule';
import ApprovalAction, { ActionType } from '@/models/ApprovalAction';
import Notification, { NotificationType } from '@/models/Notification';
import { sendApprovalNeededEmail, sendExpenseStatusEmail } from '@/lib/notifications/email';
import mongoose from 'mongoose';

// ─── Flow Resolution ───────────────────────────────────────
/**
 * Resolution Priority:
 * 1. Flow that matches the expense category
 * 2. Default flow (no category)
 */
export async function getApprovalFlow(companyId: string, category?: string): Promise<IApprovalFlow | null> {
    const orgId = companyId.toString();

    // 1. Specific Category
    if (category) {
        const flow = await ApprovalFlow.findOne({ companyId: orgId, category }).sort({ createdAt: -1 });
        if (flow) return flow;
    }

    // 2. Default
    return await ApprovalFlow.findOne({ 
        companyId: orgId, 
        $or: [{ category: null }, { category: { $exists: false } }] 
    }).sort({ createdAt: -1 });
}

// ─── Approver Chain Builder ────────────────────────────────
/**
 * Build a flat sequence of steps (Snapshot).
 * Dynamic rules (thresholds) are injected at the END.
 */
export async function buildApproverChain(expense: IExpense, flow: IApprovalFlow): Promise<IChainStep[]> {
    const chain: IChainStep[] = [];
    let idx = 0;

    // 1. Manager Step
    if (flow.isManagerApprover) {
        const employee = await User.findById(expense.employeeId);
        if (employee?.managerId) {
            chain.push({
                stepIndex: idx++,
                approverId: employee.managerId.toString(),
                role: UserRole.MANAGER,
                required: true,
                label: 'Manager Approval'
            });
        }
    }

    // 2. Flow Steps
    for (const step of flow.steps) {
        chain.push({
            stepIndex: idx++,
            approverId: step.userId?.toString(),
            role: step.role,
            required: step.required,
            autoApprove: step.autoApprove,
            label: step.label || (step.role ? `${step.role} Review` : 'User Review')
        });
    }

    // 3. Dynamic Threshold Rules
    const thresholds = await ThresholdRule.find({ 
        companyId: expense.companyId, 
        active: true, 
        minAmount: { $lte: expense.amountCompany } 
    }).sort({ minAmount: 1 });

    for (const tr of thresholds) {
        chain.push({
            stepIndex: idx++,
            approverId: tr.userId.toString(),
            required: true,
            label: tr.label
        });
    }

    return chain;
}

// ─── Approval Initialization ───────────────────────────────
export async function initializeApproval(expense: IExpense): Promise<void> {
    const flow = await getApprovalFlow(expense.companyId.toString(), expense.category);
    if (!flow) throw new Error('No approval flow found for this company/category');

    const chain = await buildApproverChain(expense, flow);
    if (chain.length === 0) {
        // Auto-approve if no steps
        expense.status = ExpenseStatus.APPROVED;
        expense.isAutoApproved = true;
    } else {
        expense.status = ExpenseStatus.PENDING;
        expense.resolvedChain = chain;
        expense.currentStepIndex = 0;
        expense.approvalFlowId = flow._id as mongoose.Types.ObjectId;

        // Skip auto-approve steps at start
        while (expense.currentStepIndex < chain.length && chain[expense.currentStepIndex].autoApprove) {
            expense.currentStepIndex++;
        }

        if (expense.currentStepIndex >= chain.length) {
            expense.status = ExpenseStatus.APPROVED;
            expense.isAutoApproved = true;
        }
    }

    await expense.save();
    
    // Notify first approver
    if (expense.status === ExpenseStatus.PENDING) {
        await notifyNextApprover(expense);
    }
}

// ─── Action Processing ─────────────────────────────────────
export async function applyApprovalAction(
    expense: IExpense,
    user: IUser,
    action: ActionType,
    comment: string
): Promise<ExpenseStatus> {
    const chain = expense.resolvedChain || [];
    const currentStep = chain[expense.currentStepIndex];

    // 1. Guard
    if (expense.status !== ExpenseStatus.PENDING) throw new Error('Expense is not in pending state');
    
    // Authorization
    const isAdmin = user.role === UserRole.ADMIN;
    const isDirectApprover = currentStep?.approverId === user._id.toString();
    const hasRole = currentStep?.role && user.role === currentStep.role;
    
    if (!isAdmin && !isDirectApprover && !hasRole) {
        throw new Error('You are not authorized to act on this step');
    }

    // 2. Audit Log
    await ApprovalAction.create({
        expenseId: expense._id,
        companyId: expense.companyId,
        approverId: user._id,
        action,
        comment,
        stepIndex: expense.currentStepIndex
    });

    // 3. Execution logic
    if (action === ActionType.REJECT) {
        expense.status = ExpenseStatus.REJECTED;
        await expense.save();
        await sendExpenseStatusEmail({
            to: (await User.findById(expense.employeeId))?.email || '',
            employeeName: 'Team Member', 
            status: 'REJECTED',
            amount: expense.amountOriginal,
            currency: expense.currencyOriginal,
            comment
        });
        return ExpenseStatus.REJECTED;
    }

    // Approve logic
    expense.currentStepIndex++;
    
    // Skip any following auto-approve steps
    while (expense.currentStepIndex < chain.length && chain[expense.currentStepIndex].autoApprove) {
        expense.currentStepIndex++;
    }

    if (expense.currentStepIndex >= chain.length) {
        expense.status = ExpenseStatus.APPROVED;
    } else {
        await notifyNextApprover(expense);
    }

    await expense.save();
    
    if (expense.status === ExpenseStatus.APPROVED) {
        await sendExpenseStatusEmail({
            to: (await User.findById(expense.employeeId))?.email || '',
            employeeName: 'Team Member',
            status: 'APPROVED',
            amount: expense.amountOriginal,
            currency: expense.currencyOriginal,
            comment
        });
    }

    return expense.status;
}

// ─── Helpers ───────────────────────────────────────────────
async function notifyNextApprover(expense: IExpense) {
    const step = expense.resolvedChain?.[expense.currentStepIndex];
    if (!step) return;

    let targetEmails: string[] = [];
    if (step.approverId) {
        const u = await User.findById(step.approverId);
        if (u?.email) targetEmails.push(u.email);
    } else if (step.role) {
        const users = await User.find({ companyId: expense.companyId, role: step.role });
        targetEmails = users.map(u => u.email).filter(Boolean) as string[];
    }

    for (const email of targetEmails) {
        await sendApprovalNeededEmail({
            to: email,
            approverName: 'Approver',
            employeeName: 'Team Member',
            amount: expense.amountOriginal,
            currency: expense.currencyOriginal,
            expenseId: expense._id.toString()
        });
    }
}

export async function canUserActOnExpense(user: IUser, expense: IExpense): Promise<boolean> {
    if (expense.status !== ExpenseStatus.PENDING) return false;
    if (user.role === UserRole.ADMIN) return true;

    const chain = expense.resolvedChain || [];
    const currentStep = chain[expense.currentStepIndex];
    if (!currentStep) return false;

    if (currentStep.approverId === user._id.toString()) return true;
    if (currentStep.role && user.role === currentStep.role) return true;

    return false;
}

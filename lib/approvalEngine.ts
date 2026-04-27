// lib/approvalEngine.ts — Rewritten to use PolicyRule-based rule engine
import User, { IUser, UserRole } from '@/models/User';
import Expense, { IExpense, ExpenseStatus, IChainStep } from '@/models/Expense';
import PolicyRule from '@/models/PolicyRule';
import ApprovalAction, { ActionType } from '@/models/ApprovalAction';
import Notification, { NotificationType } from '@/models/Notification';
import { sendApprovalNeededEmail, sendExpenseStatusEmail } from '@/lib/notifications/email';
import { selectRule, getResolvedChain, canUserActOnExpense as ruleCanUserAct, ResolvedStep } from '@/lib/ruleEngine';
import mongoose from 'mongoose';

// Re-export for backward compat
export { canUserActOnExpense } from '@/lib/ruleEngine';

// ─── Approval Initialization ───────────────────────────────────────────────
/**
 * initializeApproval — the new entry point.
 * Uses selectRule() from the rule engine to decide which PolicyRule applies,
 * snapshots the resolved chain, and advances through auto-approve steps.
 */
export async function initializeApproval(expense: IExpense): Promise<void> {
    const employeeId = (expense.employeeId as any)?._id ?? expense.employeeId;
    const employee = await User.findById(employeeId.toString());
    if (!employee) throw new Error('Employee not found');

    // ── Decision layer: which rule applies? ──
    const result = await selectRule(expense, employee);

    if (result.blocked) {
        throw new Error(
            'No approval policy matched this expense and the company has no default rule. Contact your admin.'
        );
    }

    // ── Store the snapshot ──
    expense.policyRuleId   = result.ruleId ? new mongoose.Types.ObjectId(result.ruleId) : null;
    expense.resolvedChain  = result.chain as any;
    expense.isAutoApproved = result.autoApprove;

    if (result.autoApprove) {
        // No human approvers needed — auto-approve immediately
        expense.status = ExpenseStatus.APPROVED;
        expense.currentStepIndex = 0;
        expense.currentApproverId = null;
        await expense.save();

        await ApprovalAction.create({
            expenseId:  expense._id,
            companyId:  expense.companyId,
            stepIndex:  0,
            approverId: employeeId, // system action, attributed to submitter
            action:     ActionType.APPROVE,
            comment:    `[AUTO-APPROVED by rule: ${result.ruleName}]`,
        });

        await _notifyEmployee(expense, 'APPROVED', `Auto-approved by policy: ${result.ruleName}`);
        return;
    }

    // Skip any leading autoApprove steps
    let startIndex = 0;
    for (const step of result.chain) {
        if (step.autoApprove) {
            await ApprovalAction.create({
                expenseId:  expense._id,
                companyId:  expense.companyId,
                stepIndex:  step.stepIndex,
                approverId: employeeId, // system action
                action:     ActionType.APPROVE,
                comment:    '[AUTO-APPROVED step]',
            });
            startIndex++;
        } else {
            break;
        }
    }

    // Check if all steps were auto-approved
    if (startIndex >= result.chain.length) {
        expense.status = ExpenseStatus.APPROVED;
        expense.isAutoApproved = true;
        expense.currentStepIndex = startIndex;
        expense.currentApproverId = null;
        await expense.save();
        await _notifyEmployee(expense, 'APPROVED', `All steps auto-approved by policy: ${result.ruleName}`);
        return;
    }

    expense.status = ExpenseStatus.PENDING;
    expense.currentStepIndex = startIndex;
    const firstApproverId = result.chain[startIndex]?.approverId;
    expense.currentApproverId = firstApproverId
      ? new mongoose.Types.ObjectId(firstApproverId)
      : null;
    await expense.save();

    await _notifyNextApprover(expense, result.chain, startIndex);
}

// ─── Action Processing ─────────────────────────────────────────────────────
export async function applyApprovalAction(
    expense: IExpense,
    user: IUser,
    action: ActionType,
    comment: string
): Promise<ExpenseStatus> {
    if (action === ActionType.REJECT && (!comment || comment.trim().length < 3)) {
        throw new Error('A comment is required when rejecting an expense');
    }

    const chain = getResolvedChain(expense);

    // Log this action
    await ApprovalAction.create({
        expenseId:  expense._id,
        companyId:  expense.companyId,
        stepIndex:  expense.currentStepIndex,
        approverId: user._id,
        action,
        comment:    comment ?? '',
    });

    // REJECTION
    if (action === ActionType.REJECT || action === ActionType.OVERRIDE_REJECT) {
        expense.status = ExpenseStatus.REJECTED;
        await expense.save();
        await _notifyEmployee(expense, 'REJECTED', comment);
        return ExpenseStatus.REJECTED;
    }

    // APPROVAL — check minApprovalPercent if a rule is set
    if (expense.policyRuleId) {
        const rule = await PolicyRule.findById(expense.policyRuleId);
        if (rule && rule.minApprovalPercent > 0) {
            const approvedCount = await ApprovalAction.countDocuments({
                expenseId: expense._id,
                action:    ActionType.APPROVE,
                comment: { $not: /^\[AUTO-APPROVED/ },
            });
            // approvedCount already includes the action we just created
            const humanSteps = chain.filter((step) => !step.autoApprove).length;
            const pct = humanSteps > 0 ? (approvedCount / humanSteps) * 100 : 100;
            if (pct >= rule.minApprovalPercent) {
                expense.status = ExpenseStatus.APPROVED;
                expense.currentApproverId = null;
                await expense.save();
                await _notifyEmployee(expense, 'APPROVED', '');
                return ExpenseStatus.APPROVED;
            }
        }
    }

    // Advance to next non-autoApprove step
    let nextIndex = expense.currentStepIndex + 1;
    while (nextIndex < chain.length && chain[nextIndex]?.autoApprove) {
        await ApprovalAction.create({
            expenseId:  expense._id,
            companyId:  expense.companyId,
            stepIndex:  nextIndex,
            approverId: user._id, // system action attributed to last approver
            action:     ActionType.APPROVE,
            comment:    '[AUTO-APPROVED step]',
        });
        nextIndex++;
    }

    if (nextIndex >= chain.length) {
        expense.status = ExpenseStatus.APPROVED;
        expense.currentApproverId = null;
        await expense.save();
        await _notifyEmployee(expense, 'APPROVED', '');
        return ExpenseStatus.APPROVED;
    }

    expense.currentStepIndex = nextIndex;
    expense.status = ExpenseStatus.PENDING;
    const nextApproverId = chain[nextIndex]?.approverId;
    expense.currentApproverId = nextApproverId
      ? new mongoose.Types.ObjectId(nextApproverId)
      : null;
    await expense.save();
    await _notifyNextApprover(expense, chain, nextIndex);
    return ExpenseStatus.PENDING;
}

// ─── Helper: Notify next approver ──────────────────────────────────────────
async function _notifyNextApprover(expense: IExpense, chain: ResolvedStep[], stepIndex: number) {
    const step = chain[stepIndex];
    if (!step) return;

    let targetEmails: string[] = [];
    if (step.approverId) {
        const u = await User.findById(step.approverId);
        if (u?.email) targetEmails.push(u.email);
    } else if (step.approverRole) {
        const users = await User.find({ companyId: expense.companyId, role: step.approverRole });
        targetEmails = users.map(u => u.email).filter(Boolean) as string[];
    }

    for (const email of targetEmails) {
        try {
            await sendApprovalNeededEmail({
                to: email,
                approverName: step.label ?? 'Approver',
                employeeName: 'Team Member',
                amount: expense.amountOriginal,
                currency: expense.currencyOriginal,
                expenseId: expense._id.toString(),
            });
        } catch (e) {
            console.error('Failed to send approval email:', e);
        }
    }
}

// ─── Helper: Notify employee ───────────────────────────────────────────────
async function _notifyEmployee(expense: IExpense, status: 'APPROVED' | 'REJECTED', comment: string) {
    try {
        const emp = await User.findById(expense.employeeId);
        if (!emp?.email) return;
        await sendExpenseStatusEmail({
            to: emp.email,
            employeeName: emp.name ?? 'Team Member',
            status,
            amount: expense.amountOriginal,
            currency: expense.currencyOriginal,
            comment,
        });
    } catch (e) {
        console.error('Failed to send status email:', e);
    }
}


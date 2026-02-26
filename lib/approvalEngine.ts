import User, { IUser, UserRole } from '@/models/User';
import { IExpense, ExpenseStatus } from '@/models/Expense';
import ApprovalFlow, { IApprovalFlow, StepType } from '@/models/ApprovalFlow';
import ApprovalRule from '@/models/ApprovalRule';
import { RuleType, RuleLogic } from '@/lib/types';
import ApprovalAction, { ActionType } from '@/models/ApprovalAction';

/**
 * Identify the Approval Flow for this expense.
 * For now, just picks the first flow for the company or one marked default.
 * In a real app, might depend on Expense Category or Amount.
 */
export async function getApprovalFlow(companyId: string): Promise<IApprovalFlow | null> {
    // Simple strategy: Pick the first flow created. 
    // Improvement: Add 'isDefault' flag to Flow model.
    return await ApprovalFlow.findOne({ companyId }).sort({ createdAt: 1 });
}

/**
 * Initialize approval process when expense is submitted.
 * Validates manager requirement and transitions expense to PENDING status.
 */
export async function initializeApproval(expense: IExpense): Promise<void> {
    const flow = await getApprovalFlow(expense.companyId.toString());
    if (!flow) {
        throw new Error('No approval flow found for company');
    }

    // If manager-first is required, check that employee has a manager
    if (flow.isManagerApprover) {
        const employee = await User.findById(expense.employeeId);
        if (!employee || !employee.managerId) {
            throw new Error('Employee must have a manager assigned when manager-first approval is enabled');
        }
    }

    // Transition from SUBMITTED to PENDING and set currentStepIndex to 0
    expense.status = ExpenseStatus.PENDING;
    expense.currentStepIndex = 0;
    await expense.save();
}

/**
 * Build the conceptual chain of approvers (Snapshot).
 * Note: This might change if flow definition changes, but for active expense we usually respect current state.
 * Returns array of "Expected Approvers" for each step.
 */
export async function buildApproverChain(expense: IExpense, flow: IApprovalFlow): Promise<Array<{ stepIndex: number, approverId?: string, role?: UserRole }>> {
    const chain = [];
    let stepIndex = 0;

    // 1. Manager First?
    if (flow.isManagerApprover) {
        // Fetch employee to get manager
        const employee = await User.findById(expense.employeeId).populate('managerId');
        if (employee && employee.managerId) {
            chain.push({ stepIndex: stepIndex++, approverId: (employee.managerId as unknown as { _id: string })._id.toString(), role: UserRole.MANAGER });
        } else {
            // Error: Employee has no manager but flow requires it. 
            // For safety, maybe fallback to Admin? Or block.
            // We will just skip adding it if missing, but typically should block submission.
        }
    }

    // 2. Flow Steps
    for (const step of flow.steps) {
        if (step.type === StepType.USER) {
            chain.push({ stepIndex: stepIndex++, approverId: step.userId?.toString() });
        } else {
            // Role based. Any user with this role? Or specific?
            // "Step can be ROLE-based". Implies any user with that role (e.g. any Finance Manager).
            chain.push({ stepIndex: stepIndex++, role: step.role });
        }
    }

    return chain;
}

/**
 * Check if a specific user can approve the CURRENT step of the expense.
 */
export async function canUserActOnExpense(user: IUser, expense: IExpense, flow: IApprovalFlow | null): Promise<boolean> {
    if (expense.status !== ExpenseStatus.PENDING && expense.status !== ExpenseStatus.SUBMITTED) return false;

    // 1. Try Flow-based routing first if flow exists
    if (flow && flow.steps && flow.steps.length > 0) {
        const chain = await buildApproverChain(expense, flow);
        const currentStep = chain.find(s => s.stepIndex === expense.currentStepIndex);

        if (currentStep) {
            if (currentStep.approverId && currentStep.approverId === user._id.toString()) return true;
            if (currentStep.role && user.role === currentStep.role && user.companyId.toString() === expense.companyId.toString()) {
                return true;
            }
        }
    }

    // 2. Fallback to Rule-based routing
    // Find a rule that applies to this employee
    const rule = await ApprovalRule.findOne({
        organization: expense.companyId.toString(),
        $or: [
            { appliesToUser: expense.employeeId },
            { appliesToUser: { $exists: false } },
            { appliesToUser: null }
        ]
    });

    if (rule) {
        // Is user the manager and manager is required?
        if (rule.isManagerApprover && rule.manager && rule.manager.toString() === user._id.toString()) {
            return true;
        }

        // Is user in the approvers list?
        if (rule.approvers && rule.approvers.length > 0) {
            const isApprover = rule.approvers.some(a => a.user.toString() === user._id.toString());
            if (isApprover) {
                return true; // Simple "any un-actioned approver can act" model for now
            }
        }
    }

    // Admin Override is handled separately.
    return false;
}

/**
 * Process an Action (Approve/Reject).
 * Returns the NEW status of the expense.
 */
export async function applyApprovalAction(
    expense: IExpense,
    user: IUser,
    action: ActionType,
    comment: string
): Promise<ExpenseStatus> {
    const flow = await getApprovalFlow(expense.companyId.toString());
    if (!flow) throw new Error('No approval flow found');

    // 1. Log the Action
    await ApprovalAction.create({
        expenseId: expense._id,
        companyId: expense.companyId,
        stepIndex: expense.currentStepIndex,
        approverId: user._id,
        action,
        comment,
    });

    // 2. Reject Case
    if (action === ActionType.REJECT) {
        expense.status = ExpenseStatus.REJECTED;
        await expense.save();
        return ExpenseStatus.REJECTED;
    }

    // 3. Approve Case
    // Check Conditional Rules for "Skip to Approved"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rules: any[] = await ApprovalRule.find({ companyId: expense.companyId, flowId: flow._id, active: true } as any);

    let isAutoApproved = false;

    for (const rule of rules) {
        let specificMatched = false;
        let percentMatched = false;

        // Specific Approver Rule: If THIS user approved, is it auto-done?
        if (rule.type === RuleType.SPECIFIC_APPROVER || rule.type === RuleType.HYBRID) {
            if (rule.specificApproverUserId && rule.specificApproverUserId.toString() === user._id.toString()) {
                specificMatched = true;
            }
        }

        // Percentage Rule (Complex: needs total chain count?)
        // "percentageThreshold: approvedCount / totalApprovers >= threshold"
        // We need to count TOTAL potential approvers in chain vs Current Step + 1 (since we just approved)
        if (rule.type === RuleType.PERCENTAGE || rule.type === RuleType.HYBRID) {
            if (rule.percentageThreshold) {
                const chain = await buildApproverChain(expense, flow);
                const totalSteps = chain.length;
                const currentCount = expense.currentStepIndex + 1; // 1-based count of approvals including this one
                const percent = (currentCount / totalSteps) * 100;
                if (percent >= rule.percentageThreshold) {
                    percentMatched = true;
                }
            }
        }

        // Evaluate Logic
        if (rule.type === RuleType.SPECIFIC_APPROVER && specificMatched) isAutoApproved = true;
        if (rule.type === RuleType.PERCENTAGE && percentMatched) isAutoApproved = true;
        if (rule.type === RuleType.HYBRID) {
            if (rule.logic === RuleLogic.OR && (specificMatched || percentMatched)) isAutoApproved = true;
            if (rule.logic === RuleLogic.AND && (specificMatched && percentMatched)) isAutoApproved = true;
        }
    }

    if (isAutoApproved) {
        // Log auto-approval action
        await ApprovalAction.create({
            expenseId: expense._id,
            companyId: expense.companyId,
            stepIndex: expense.currentStepIndex,
            approverId: user._id,
            action: ActionType.APPROVE,
            comment: '[AUTO-APPROVED BY RULE]',
        });

        expense.status = ExpenseStatus.APPROVED;
        await expense.save();
        return ExpenseStatus.APPROVED;
    }

    // 4. Move to Next Step
    const chain = await buildApproverChain(expense, flow);
    const nextStepIndex = expense.currentStepIndex + 1;

    if (nextStepIndex >= chain.length) {
        // End of chain -> Approved
        expense.status = ExpenseStatus.APPROVED;
    } else {
        // Next step
        expense.currentStepIndex = nextStepIndex;
        expense.status = ExpenseStatus.PENDING; // Ensure stays pending
    }

    await expense.save();
    return expense.status;
}

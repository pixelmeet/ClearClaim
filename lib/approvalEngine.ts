import User, { IUser, UserRole } from '@/models/User';
import { IExpense, ExpenseStatus } from '@/models/Expense';
import ApprovalFlow, { IApprovalFlow, StepType } from '@/models/ApprovalFlow';
import ApprovalRule from '@/models/ApprovalRule';
import { RuleType, RuleLogic } from '@/lib/types';
import ApprovalAction, { ActionType } from '@/models/ApprovalAction';
import Notification, { NotificationType } from '@/models/Notification';

/**
 * Identify the Approval Flow or Rule for this expense.
 * Resolution Priority:
 * 1. Explicit ApprovalFlow document (if any)
 * 2. ApprovalRule matching specific user
 * 3. ApprovalRule matching organization (global fallback)
 * 4. Any ApprovalRule for organization (last resort)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getApprovalFlow(companyId: string, expense?: IExpense | any): Promise<any | null> {
    const orgId = companyId.toString();

    // 1. Try Flow first (Legacy/Explicit)
    const flow = await ApprovalFlow.findOne({ companyId: orgId }).sort({ createdAt: 1 });
    if (flow) return flow;

    // Helper to adapt rule to a flow-like object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adaptRuleToFlow = (rule: any) => ({
        _id: rule._id,
        companyId: rule.organization,
        isManagerApprover: rule.isManagerApprover,
        steps: (rule.approvers || []).map((a: any) => ({
            type: StepType.USER,
            userId: a.user,
        })),
        isRule: true,
        ruleName: rule.ruleName
    });

    // 2. Specific Rule Fallback
    if (expense && expense.employeeId) {
        const userId = expense.employeeId._id || expense.employeeId;
        const specificRule = await ApprovalRule.findOne({ 
            organization: orgId, 
            appliesToUser: userId 
        }).sort({ createdAt: -1 });

        if (specificRule) return adaptRuleToFlow(specificRule);
    }

    // 3. Global Rule Fallback (where appliesToUser is null or missing)
    const globalRule = await ApprovalRule.findOne({ 
        organization: orgId, 
        $or: [{ appliesToUser: null }, { appliesToUser: { $exists: false } }]
    }).sort({ createdAt: -1 });

    if (globalRule) return adaptRuleToFlow(globalRule);

    // 4. Last Resort: Any rule for this organization
    const anyRule = await ApprovalRule.findOne({ organization: orgId }).sort({ createdAt: -1 });
    if (anyRule) return adaptRuleToFlow(anyRule);

    return null;
}

/**
 * Initialize approval process when expense is submitted.
 * Validates manager requirement and transitions expense to PENDING status.
 */
export async function initializeApproval(expense: IExpense): Promise<void> {
    const flow = await getApprovalFlow(expense.companyId.toString(), expense);
    if (!flow) {
        throw new Error(`No approval flow or active rule found for organization: ${expense.companyId}`);
    }

    // If manager-first is required, check that employee has a manager
    if (flow.isManagerApprover) {
        const employeeId = (expense.employeeId._id || expense.employeeId).toString();
        const employee = await User.findById(employeeId);
        if (!employee || !employee.managerId) {
            throw new Error('Employee must have a manager assigned when manager-first approval is enabled');
        }
    }

    // Transition from SUBMITTED to PENDING and set currentStepIndex to 0
    expense.status = ExpenseStatus.PENDING;
    expense.currentStepIndex = 0;
    await expense.save();

    // Create Notification for the first approver
    try {
        const chain = await buildApproverChain(expense, flow);
        if (chain.length > 0 && chain[0].approverId) {
            await Notification.create({
                user: chain[0].approverId,
                title: 'New Expense Awaiting Approval',
                message: `An expense of ${expense.currencyOriginal} ${expense.amountOriginal} has been submitted by a team member.`,
                type: NotificationType.INFO,
                link: '/admin/expenses' // Fallback link
            });
        }
    } catch (e) {
        console.error('Failed to dispatch initialization notification', e);
    }
}

/**
 * Build the conceptual chain of approvers (Snapshot).
 * Returns array of "Expected Approvers" for each step.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildApproverChain(expense: IExpense, flow: any): Promise<Array<{ stepIndex: number, approverId?: string, role?: UserRole }>> {
    const chain = [];
    let stepIndex = 0;

    // 1. Manager First?
    if (flow.isManagerApprover) {
        // Fetch employee to get manager
        const employeeId = (expense.employeeId._id || expense.employeeId).toString();
        const employee = await User.findById(employeeId).populate('managerId');
        if (employee && employee.managerId) {
            const manager = employee.managerId as any;
            chain.push({ 
                stepIndex: stepIndex++, 
                approverId: (manager._id || manager).toString(), 
                role: UserRole.MANAGER 
            });
        }
    }

    // 2. Flow Steps (Supports both Flow's .steps and adapted Rule's .steps)
    if (flow.steps && Array.isArray(flow.steps)) {
        for (const step of flow.steps) {
            if (step.type === StepType.USER) {
                chain.push({ stepIndex: stepIndex++, approverId: step.userId?.toString() });
            } else if (step.type === StepType.ROLE) {
                chain.push({ stepIndex: stepIndex++, role: step.role });
            }
        }
    }

    return chain;
}

/**
 * Check if a specific user can approve the CURRENT step of the expense.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function canUserActOnExpense(user: IUser, expense: IExpense, flow: any | null): Promise<boolean> {
    // If no flow was provided (e.g. from API route), try to discover it
    let activeFlow = flow;
    if (!activeFlow) {
        activeFlow = await getApprovalFlow(expense.companyId.toString(), expense);
    }
    
    if (expense.status !== ExpenseStatus.PENDING && expense.status !== ExpenseStatus.SUBMITTED) return false;

    // 1. Try Flow/Rule-based routing first if flow exists
    if (activeFlow && activeFlow.steps && activeFlow.steps.length >= 0) { // >= 0 because manager first might be only step
        const chain = await buildApproverChain(expense, activeFlow);
        const currentStep = chain.find(s => s.stepIndex === expense.currentStepIndex);

        if (currentStep) {
            if (currentStep.approverId && currentStep.approverId === user._id.toString()) return true;
            if (currentStep.role && user.role === currentStep.role && user.companyId.toString() === expense.companyId.toString()) {
                return true;
            }
        }
    }

    // Admins can ALWAYS act if they are in the same company
    const userCompanyId = user.companyId?._id || user.companyId;
    const expenseCompanyId = expense.companyId?._id || expense.companyId;

    if (user.role === UserRole.ADMIN && userCompanyId.toString() === expenseCompanyId.toString()) {
        return true;
    }

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
    const flow = await getApprovalFlow(expense.companyId.toString(), expense);
    if (!flow) throw new Error(`No approval flow found for expense: ${expense._id}`);

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
        
        // Notify Submitter
        try {
            await Notification.create({
                user: expense.employeeId._id || expense.employeeId,
                title: 'Expense Rejected',
                message: `Your expense of ${expense.currencyOriginal} ${expense.amountOriginal} was rejected. Reason: ${comment}`,
                type: NotificationType.ERROR,
                link: `/dashboard/expenses/${expense._id}`
            });
        } catch(e) { console.error(e); }

        return ExpenseStatus.REJECTED;
    }

    // 3. Approve Case
    // Check Conditional Rules for "Skip to Approved"
    // Use ApprovalRule model for logic
    const rules = await ApprovalRule.find({ 
        organization: expense.companyId.toString(),
        $or: [
            { appliesToUser: (expense.employeeId._id || expense.employeeId).toString() },
            { appliesToUser: null },
            { appliesToUser: { $exists: false } }
        ]
    });

    let isAutoApproved = false;

    for (const rule of rules) {
        let matched = false;
        
        // Check if user is in the approvers list of the rule
        const isUserInRuleApprovers = rule.approvers?.some(a => a.user.toString() === user._id.toString());
        if (isUserInRuleApprovers) {
            matched = true;
        }

        // Percentage Rule
        if (rule.minApprovalPercent) {
            const chain = await buildApproverChain(expense, flow);
            const totalSteps = chain.length;
            const currentCount = expense.currentStepIndex + 1;
            const percent = (currentCount / totalSteps) * 100;
            if (percent >= rule.minApprovalPercent) {
                matched = true;
            }
        }

        if (matched) {
             isAutoApproved = true;
             break;
        }
    }

    if (isAutoApproved) {
        expense.status = ExpenseStatus.APPROVED;
        await expense.save();
        
        // Notify Submitter
        try {
            await Notification.create({
                user: expense.employeeId._id || expense.employeeId,
                title: 'Expense Approved',
                message: `Your expense of ${expense.currencyOriginal} ${expense.amountOriginal} has been fully approved!`,
                type: NotificationType.SUCCESS,
                link: `/dashboard/expenses/${expense._id}`
            });
        } catch(e) { console.error(e); }

        return ExpenseStatus.APPROVED;
    }

    // 4. Move to Next Step
    const chain = await buildApproverChain(expense, flow);
    const nextStepIndex = expense.currentStepIndex + 1;

    if (nextStepIndex >= chain.length) {
        // End of chain -> Approved
        expense.status = ExpenseStatus.APPROVED;
        
        // Notify Submitter
        try {
            await Notification.create({
                user: expense.employeeId._id || expense.employeeId,
                title: 'Expense Approved',
                message: `Your expense of ${expense.currencyOriginal} ${expense.amountOriginal} has been fully approved!`,
                type: NotificationType.SUCCESS,
                link: `/dashboard/expenses/${expense._id}`
            });
        } catch(e) { console.error(e); }
        
    } else {
        // Next step
        expense.currentStepIndex = nextStepIndex;
        expense.status = ExpenseStatus.PENDING;
        
        // Notify Next Approver
        try {
            const nextApproverId = chain[nextStepIndex]?.approverId;
            if (nextApproverId) {
                await Notification.create({
                    user: nextApproverId,
                    title: 'Expense Awaiting Action',
                    message: `An expense in your queue requires approval.`,
                    type: NotificationType.INFO,
                    link: '/admin/expenses'
                });
            }
        } catch(e) { console.error(e); }
    }

    await expense.save();
    return expense.status;
}



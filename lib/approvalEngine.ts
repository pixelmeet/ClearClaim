import User, { IUser, UserRole } from '@/models/User';
import { IExpense, ExpenseStatus } from '@/models/Expense';
import ApprovalFlow, { IApprovalFlow, StepType } from '@/models/ApprovalFlow';

import ApprovalAction, { ActionType } from '@/models/ApprovalAction';
import Notification, { NotificationType } from '@/models/Notification';
import { sendApprovalNeededEmail, sendExpenseStatusEmail } from '@/lib/notifications/email';

// ─── Types ─────────────────────────────────────────────────
interface ChainStep {
    stepIndex: number;
    approverId?: string;
    role?: UserRole;
    required?: boolean;
    autoApprove?: boolean;
}

// ─── Dynamic Rules (replaces legacy ApprovalRule system) ───
/**
 * Apply dynamic, code-based rules to inject extra approval steps.
 * These rules live in code for auditability and are easy to extend.
 * Returns additional steps to append to the chain.
 */
function applyDynamicRules(expense: IExpense, startIndex: number): ChainStep[] {
    const extraSteps: ChainStep[] = [];
    let idx = startIndex;

    // Rule 1: High-value expenses (> 10,000 in company currency) require CFO/ADMIN approval
    if (expense.amountCompany > 10000) {
        extraSteps.push({
            stepIndex: idx++,
            role: UserRole.ADMIN,
            required: true,
            autoApprove: false,
        });
    }

    // Rule 2: Travel expenses above 5,000 need extra scrutiny
    if (expense.category === 'TRAVEL' && expense.amountCompany > 5000) {
        extraSteps.push({
            stepIndex: idx++,
            role: UserRole.ADMIN,
            required: true,
            autoApprove: false,
        });
    }

    // Add more rules here as needed:
    // if (expense.someCondition) { extraSteps.push(...) }

    return extraSteps;
}

// ─── Flow Resolution ───────────────────────────────────────
/**
 * Identify the Approval Flow for this expense.
 * Resolution Priority:
 * 1. Flow that matches the expense category
 * 2. Default flow (no category)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getApprovalFlow(companyId: string, expense?: IExpense | any): Promise<any | null> {
    const orgId = companyId.toString();

    // 1. Try to find a flow that matches the expense category (latest wins)
    if (expense?.category) {
        const categoryFlow = await ApprovalFlow.findOne({
            companyId: orgId,
            category: expense.category,
        }).sort({ createdAt: -1 });
        if (categoryFlow) return categoryFlow;
    }

    // 2. Fall back to default flow (no category) (latest wins)
    const defaultFlow = await ApprovalFlow.findOne({
        companyId: orgId,
        $or: [{ category: null }, { category: { $exists: false } }],
    }).sort({ createdAt: -1 });
    if (defaultFlow) return defaultFlow;

    return null;
}

// ─── Approval Initialization ───────────────────────────────
/**
 * Initialize approval process when expense is submitted.
 * Validates manager requirement and transitions expense to PENDING status.
 */
export async function initializeApproval(expense: IExpense): Promise<void> {
    const flow = await getApprovalFlow(expense.companyId.toString(), expense);
    if (!flow) {
        throw new Error(`No approval flow found for organization: ${expense.companyId}`);
    }
    expense.approvalFlowId = flow._id;

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
                link: '/admin/expenses'
            });
        }
    } catch (e) {
        console.error('Failed to dispatch initialization notification', e);
    }
}

// ─── Approver Chain Builder ────────────────────────────────
/**
 * Build the conceptual chain of approvers (Snapshot).
 * Order: Manager (if enabled) → Flow Steps → Dynamic Rules
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildApproverChain(expense: IExpense, flow: any): Promise<ChainStep[]> {
    const chain: ChainStep[] = [];
    let stepIndex = 0;

    // 1. Manager First?
    if (flow.isManagerApprover) {
        const populatedEmployee: any = expense.employeeId as any;
        const employeeId = (populatedEmployee?._id || expense.employeeId).toString();

        const managerFromPopulate =
            populatedEmployee && typeof populatedEmployee === 'object'
                ? populatedEmployee.managerId
                : null;

        if (managerFromPopulate) {
            const mgr: any = managerFromPopulate;
            chain.push({
                stepIndex: stepIndex++,
                approverId: (mgr._id || mgr).toString(),
                role: UserRole.MANAGER,
                required: true, // Manager step is always required when enabled
            });
        } else {
            const employee = await User.findById(employeeId).populate('managerId');
            if (employee && employee.managerId) {
                const manager = employee.managerId as any;
                chain.push({
                    stepIndex: stepIndex++,
                    approverId: (manager._id || manager).toString(),
                    role: UserRole.MANAGER,
                    required: true,
                });
            }
        }
    }

    // 2. Flow Steps
    if (flow.steps && Array.isArray(flow.steps)) {
        for (const step of flow.steps) {
            if (step.type === StepType.USER) {
                chain.push({ 
                    stepIndex: stepIndex++, 
                    approverId: step.userId?.toString(),
                    required: step.required || false,
                    autoApprove: step.autoApprove || false
                });
            } else if (step.type === StepType.ROLE) {
                chain.push({ 
                    stepIndex: stepIndex++, 
                    role: step.role,
                    required: step.required || false,
                    autoApprove: step.autoApprove || false
                });
            }
        }
    }

    // 3. Dynamic Rules (amount-based, category-based, etc.)
    const dynamicSteps = applyDynamicRules(expense, stepIndex);
    chain.push(...dynamicSteps);

    return chain;
}

// ─── Authorization Check ───────────────────────────────────
/**
 * Check if a specific user can approve the CURRENT step of the expense.
 * Security: validates company membership at every check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function canUserActOnExpense(user: IUser, expense: IExpense, flow: any | null): Promise<boolean> {
    // Security: Company isolation check
    const userCompanyId = (user.companyId?._id || user.companyId)?.toString();
    const expenseCompanyId = (expense.companyId?._id || expense.companyId)?.toString();

    if (!userCompanyId || !expenseCompanyId || userCompanyId !== expenseCompanyId) {
        return false; // Strict tenant isolation
    }

    if (expense.status !== ExpenseStatus.PENDING && expense.status !== ExpenseStatus.SUBMITTED) {
        return false;
    }

    // If no flow was provided, try to discover it
    let activeFlow = flow;
    if (!activeFlow) {
        if (expense.approvalFlowId) {
            activeFlow = await ApprovalFlow.findById(expense.approvalFlowId);
        }
        if (!activeFlow) {
            activeFlow = await getApprovalFlow(expense.companyId.toString(), expense);
        }
    }

    // Flow/Chain-based routing
    if (activeFlow && activeFlow.steps && activeFlow.steps.length >= 0) {
        const chain = await buildApproverChain(expense, activeFlow);
        const currentStep = chain.find(s => s.stepIndex === expense.currentStepIndex);

        if (currentStep) {
            // Direct user match
            if (currentStep.approverId && currentStep.approverId === user._id.toString()) return true;

            // Role match (must also be same company — already checked above)
            if (currentStep.role && user.role === currentStep.role) {
                return true;
            }

            // Delegation: allow delegate to act for the current step's approver
            if (currentStep.approverId) {
                const originalApprover = await User.findById(currentStep.approverId);
                if (
                    originalApprover?.delegatedTo?.toString() === user._id.toString() &&
                    (!originalApprover.delegationExpiresAt ||
                        originalApprover.delegationExpiresAt > new Date())
                ) {
                    return true;
                }
            }
        }
    }

    // Admins can ALWAYS act if they are in the same company (already verified above)
    if (user.role === UserRole.ADMIN) {
        return true;
    }

    return false;
}

// ─── Approval Action Processing ────────────────────────────
/**
 * Process an Action (Approve/Reject).
 * Enforces: required steps, percentage-based approval, autoApprove logic.
 * Returns the NEW status of the expense.
 */
export async function applyApprovalAction(
    expense: IExpense,
    user: IUser,
    action: ActionType,
    comment: string
): Promise<ExpenseStatus> {
    let flow = null;
    if (expense.approvalFlowId) {
        flow = await ApprovalFlow.findById(expense.approvalFlowId);
    }
    if (!flow) {
        flow = await getApprovalFlow(expense.companyId.toString(), expense);
    }
    if (!flow) throw new Error(`No approval flow found for expense: ${expense._id}`);

    // Security: verify user can act
    const canAct = await canUserActOnExpense(user, expense, flow);
    if (!canAct) {
        throw new Error('User is not authorized to act on this expense at the current step.');
    }

    // 1. Log the Action
    await ApprovalAction.create({
        expenseId: expense._id,
        companyId: expense.companyId,
        stepIndex: expense.currentStepIndex,
        approverId: user._id,
        action,
        comment,
    });

    // 2. Reject Case — immediate rejection
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

        // Email submitter (non-fatal)
        try {
            const employee = await User.findById(expense.employeeId).select('name email');
            if (employee?.email) {
                await sendExpenseStatusEmail({
                    to: employee.email,
                    employeeName: employee.name,
                    status: 'REJECTED',
                    amount: expense.amountOriginal,
                    currency: expense.currencyOriginal,
                    comment,
                });
            }
        } catch (e) {
            console.error('Email notification failed (non-fatal):', e);
        }

        return ExpenseStatus.REJECTED;
    }

    // 3. Approve Case
    const chain = await buildApproverChain(expense, flow);
    const currentStep = chain[expense.currentStepIndex];
    if (!currentStep) throw new Error("Current step not found in chain");

    // Fetch all approved actions for this expense
    const approvedActions = await ApprovalAction.find({
        expenseId: expense._id,
        action: ActionType.APPROVE,
    });
    const approvedStepIndices = new Set(approvedActions.map((a: any) => a.stepIndex));
    // Include the current step being approved
    approvedStepIndices.add(expense.currentStepIndex);

    // Check if we can auto-complete (skip remaining non-required steps)
    let canAutoComplete = false;

    // Check step-level autoApprove flag
    if (currentStep.autoApprove) {
        canAutoComplete = true;
    }

    // Check percentage-based approval
    const minPercent = flow.minApprovalPercent ?? 100;
    if (minPercent > 0 && minPercent < 100 && chain.length > 0) {
        const approvedPercent = (approvedStepIndices.size / chain.length) * 100;
        if (approvedPercent >= minPercent) {
            canAutoComplete = true;
        }
    }

    if (canAutoComplete) {
        // Skip remaining steps → APPROVED
        expense.status = ExpenseStatus.APPROVED;
        (expense as any).isAutoApproved = true;
        await expense.save();
        await notifyApproval(expense, comment);
        return ExpenseStatus.APPROVED;
    }

    // 4. Move to Next Step
    const nextStepIndex = expense.currentStepIndex + 1;

    if (nextStepIndex >= chain.length) {
        // End of chain → Approved
        expense.status = ExpenseStatus.APPROVED;
        await expense.save();
        await notifyApproval(expense, comment);
    } else {
        // Next step
        expense.currentStepIndex = nextStepIndex;
        expense.status = ExpenseStatus.PENDING;
        await expense.save();

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

                // Email next approver (non-fatal)
                try {
                    const nextApprover = await User.findById(nextApproverId).select('name email');
                    const employee = await User.findById(expense.employeeId).select('name');
                    if (nextApprover?.email && employee) {
                        await sendApprovalNeededEmail({
                            to: nextApprover.email,
                            approverName: nextApprover.name,
                            employeeName: employee.name,
                            amount: expense.amountOriginal,
                            currency: expense.currencyOriginal,
                            expenseId: expense._id.toString(),
                        });
                    }
                } catch (e) {
                    console.error('Email notification failed (non-fatal):', e);
                }
            }
        } catch(e) { console.error(e); }
    }

    return expense.status;
}

// ─── Notification Helpers ──────────────────────────────────
async function notifyApproval(expense: IExpense, comment: string): Promise<void> {
    try {
        await Notification.create({
            user: expense.employeeId._id || expense.employeeId,
            title: 'Expense Approved',
            message: `Your expense of ${expense.currencyOriginal} ${expense.amountOriginal} has been fully approved!`,
            type: NotificationType.SUCCESS,
            link: `/dashboard/expenses/${expense._id}`
        });
    } catch(e) { console.error(e); }

    try {
        const employee = await User.findById(expense.employeeId).select('name email');
        if (employee?.email) {
            await sendExpenseStatusEmail({
                to: employee.email,
                employeeName: employee.name,
                status: 'APPROVED',
                amount: expense.amountOriginal,
                currency: expense.currencyOriginal,
                comment,
            });
        }
    } catch (e) {
        console.error('Email notification failed (non-fatal):', e);
    }
}

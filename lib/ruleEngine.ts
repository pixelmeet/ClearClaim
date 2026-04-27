// lib/ruleEngine.ts — The decision layer
// Given an expense and employee, finds the highest-priority matching PolicyRule
// and returns the resolved approver chain.
import mongoose from 'mongoose';
import PolicyRule, {
  ConditionField,
  ConditionOperator,
  ConditionLogic,
  StepApproverType,
} from '@/models/PolicyRule';
import User from '@/models/User';
import type { IExpense } from '@/models/Expense';
import type { IUser } from '@/models/User';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResolvedStep {
  stepIndex:    number;
  approverType: StepApproverType;
  approverId:   string | null;
  approverRole: string | null;
  required:     boolean;
  autoApprove:  boolean;
  label:        string | null;
}

export interface RuleEngineResult {
  matched:     boolean;
  ruleId:      string | null;
  ruleName:    string | null;
  chain:       ResolvedStep[];
  autoApprove: boolean;   // true = no human approvers needed
  blocked:     boolean;   // true = no rule matched and fallback=BLOCK
}

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * selectRule — the decision layer.
 * Given an expense and the submitting employee, finds the highest-priority
 * matching PolicyRule and returns the resolved approver chain.
 *
 * This is called ONCE at submission time. The result is stored on the Expense.
 */
export async function selectRule(
  expense: IExpense,
  employee: IUser
): Promise<RuleEngineResult> {
  const companyId = expense.companyId;

  // Load all active rules for this company, ordered by priority ASC (1 = highest)
  const rules = await PolicyRule.find({
    companyId,
    active: true,
    isDefault: false,
  }).sort({ priority: 1 });

  // Evaluate each rule's conditions
  for (const rule of rules) {
    const matches = evaluateConditions(rule, expense, employee);
    if (matches) {
      const chain = await resolveSteps(rule.steps, expense, employee);
      return {
        matched:     true,
        ruleId:      rule._id.toString(),
        ruleName:    rule.name,
        chain,
        autoApprove: chain.length === 0 || chain.every(s => s.autoApprove),
        blocked:     false,
      };
    }
  }

  // No rule matched — find the default rule
  const defaultRule = await PolicyRule.findOne({
    companyId,
    active: true,
    isDefault: true,
  });

  if (!defaultRule) {
    // No default rule configured — block by convention
    return { matched: false, ruleId: null, ruleName: null, chain: [], autoApprove: false, blocked: true };
  }

  if (defaultRule.fallbackBehavior === 'AUTO_APPROVE') {
    return { matched: true, ruleId: defaultRule._id.toString(), ruleName: defaultRule.name, chain: [], autoApprove: true, blocked: false };
  }

  if (defaultRule.fallbackBehavior === 'BLOCK') {
    return { matched: false, ruleId: null, ruleName: null, chain: [], autoApprove: false, blocked: true };
  }

  // DEFAULT_FLOW — use the default rule's own steps
  const chain = await resolveSteps(defaultRule.steps, expense, employee);
  return {
    matched:     true,
    ruleId:      defaultRule._id.toString(),
    ruleName:    defaultRule.name,
    chain,
    autoApprove: chain.length === 0 || chain.every(s => s.autoApprove),
    blocked:     false,
  };
}

// ─── Condition evaluation ────────────────────────────────────────────────────

function evaluateConditions(rule: any, expense: IExpense, employee: IUser): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true; // no conditions = always matches

  const results = rule.conditions.map((condition: any) =>
    evaluateSingleCondition(condition, expense, employee)
  );

  if (rule.conditionLogic === ConditionLogic.OR) {
    return results.some(Boolean);
  }
  return results.every(Boolean); // AND (default)
}

function evaluateSingleCondition(condition: any, expense: IExpense, employee: IUser): boolean {
  const { field, operator, value } = condition;

  let actual: any;

  switch (field as ConditionField) {
    case ConditionField.AMOUNT:
      actual = expense.amountCompany ?? expense.amountOriginal;
      break;
    case ConditionField.CATEGORY:
      actual = expense.category;
      break;
    case ConditionField.DEPARTMENT:
      actual = (employee as any).department ?? null;
      break;
    case ConditionField.EMPLOYEE_ROLE:
      actual = employee.role;
      break;
    case ConditionField.EMPLOYEE_ID:
      actual = employee._id.toString();
      break;
    case ConditionField.CURRENCY:
      actual = expense.currencyOriginal;
      break;
    default:
      return false;
  }

  return applyOperator(actual, operator as ConditionOperator, value);
}

function applyOperator(actual: any, operator: ConditionOperator, expected: any): boolean {
  switch (operator) {
    case ConditionOperator.GT:  return Number(actual) >  Number(expected);
    case ConditionOperator.GTE: return Number(actual) >= Number(expected);
    case ConditionOperator.LT:  return Number(actual) <  Number(expected);
    case ConditionOperator.LTE: return Number(actual) <= Number(expected);
    case ConditionOperator.EQ:  return String(actual) === String(expected);
    case ConditionOperator.NEQ: return String(actual) !== String(expected);
    case ConditionOperator.IN:
      if (!Array.isArray(expected)) return false;
      return expected.map(String).includes(String(actual));
    default:
      return false;
  }
}

// ─── Step resolution ─────────────────────────────────────────────────────────

/**
 * resolveSteps — converts a rule's step definitions into concrete approver entries.
 * MANAGER type is resolved to the actual manager's user ID here.
 */
async function resolveSteps(
  steps: any[],
  expense: IExpense,
  employee: IUser
): Promise<ResolvedStep[]> {
  const resolved: ResolvedStep[] = [];

  for (const step of steps) {
    if (step.approverType === StepApproverType.MANAGER) {
      // Resolve manager at chain-build time — not at approval time
      const emp = await User.findById(employee._id).populate('managerId');
      const manager = (emp?.managerId as any);
      if (!manager) {
        throw new Error(
          `Rule step requires manager approval but employee ${employee.name} has no manager assigned.`
        );
      }
      resolved.push({
        stepIndex:    step.stepIndex,
        approverType: StepApproverType.MANAGER,
        approverId:   (manager._id ?? manager).toString(),
        approverRole: null,
        required:     step.required ?? true,
        autoApprove:  step.autoApprove ?? false,
        label:        step.label ?? 'Manager approval',
      });
    } else if (step.approverType === StepApproverType.USER) {
      resolved.push({
        stepIndex:    step.stepIndex,
        approverType: StepApproverType.USER,
        approverId:   step.approverId?.toString() ?? null,
        approverRole: null,
        required:     step.required ?? true,
        autoApprove:  step.autoApprove ?? false,
        label:        step.label ?? null,
      });
    } else if (step.approverType === StepApproverType.ROLE) {
      resolved.push({
        stepIndex:    step.stepIndex,
        approverType: StepApproverType.ROLE,
        approverId:   null,
        approverRole: step.approverRole,
        required:     step.required ?? true,
        autoApprove:  step.autoApprove ?? false,
        label:        step.label ?? `${step.approverRole} approval`,
      });
    }
  }

  // Sort by stepIndex (rules UI should already do this, but be defensive)
  return resolved.sort((a, b) => a.stepIndex - b.stepIndex);
}

// ─── Chain query helper ───────────────────────────────────────────────────────

/**
 * getResolvedChain — returns the stored resolved chain from an expense.
 * Use this everywhere instead of recomputing. Recomputation after submission
 * causes chain drift if an admin edits a rule mid-approval.
 */
export function getResolvedChain(expense: any): ResolvedStep[] {
  return (expense.resolvedChain ?? []) as ResolvedStep[];
}

/**
 * canUserActOnStep — checks if a user is the correct approver for a specific step.
 * Works for USER, ROLE, and MANAGER step types.
 */
export function canUserActOnStep(user: IUser, step: ResolvedStep): boolean {
  if (!step) return false;

  if (step.approverType === StepApproverType.USER || step.approverType === StepApproverType.MANAGER) {
    return step.approverId === user._id.toString();
  }

  if (step.approverType === StepApproverType.ROLE) {
    return user.role === step.approverRole;
  }

  return false;
}

/**
 * canUserActOnExpense — checks if user can act on the current step of an expense.
 * This is the function the action route should call.
 */
export function canUserActOnExpense(user: IUser, expense: any): boolean {
  const chain = getResolvedChain(expense);
  const currentStep = chain[expense.currentStepIndex];
  if (!currentStep) return false;
  return canUserActOnStep(user, currentStep);
}

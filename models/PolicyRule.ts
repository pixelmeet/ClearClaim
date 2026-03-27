// models/PolicyRule.ts
import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, ExpenseCategory } from '@/lib/types';

// ─── Condition types ────────────────────────────────────────────────────────

export enum ConditionField {
  AMOUNT          = 'amount',           // expense.amountCompany
  CATEGORY        = 'category',         // expense.category
  DEPARTMENT      = 'department',       // employee.department
  EMPLOYEE_ROLE   = 'employeeRole',     // employee.role
  EMPLOYEE_ID     = 'employeeId',       // specific employee
  CURRENCY        = 'currency',         // expense.currencyOriginal
}

export enum ConditionOperator {
  GT  = 'gt',   // >
  GTE = 'gte',  // >=
  LT  = 'lt',   // <
  LTE = 'lte',  // <=
  EQ  = 'eq',   // ==
  NEQ = 'neq',  // !=
  IN  = 'in',   // value is in array
}

export enum ConditionLogic {
  AND = 'AND',  // ALL conditions must match
  OR  = 'OR',   // ANY condition must match
}

// ─── Step types ─────────────────────────────────────────────────────────────

export enum StepApproverType {
  USER    = 'USER',     // specific user by ID
  ROLE    = 'ROLE',     // any user with this role
  MANAGER = 'MANAGER',  // employee's direct manager
}

export enum FallbackBehavior {
  AUTO_APPROVE = 'AUTO_APPROVE',  // approve instantly, no human needed
  BLOCK        = 'BLOCK',         // reject — no matching rule = not allowed
  DEFAULT_FLOW = 'DEFAULT_FLOW',  // fall back to a designated default PolicyRule
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const ConditionSchema = new Schema({
  field:    { type: String, enum: Object.values(ConditionField),    required: true },
  operator: { type: String, enum: Object.values(ConditionOperator), required: true },
  value:    { type: Schema.Types.Mixed, required: true },
  // For IN operator, value should be an array. For others, a scalar.
}, { _id: false });

const PolicyStepSchema = new Schema({
  stepIndex:    { type: Number, required: true },
  approverType: { type: String, enum: Object.values(StepApproverType), required: true },
  approverId:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approverRole: { type: String, enum: [...Object.values(UserRole), null], default: null },
  required:     { type: Boolean, default: true },
  autoApprove:  { type: Boolean, default: false },
  label:        { type: String, default: null },
}, { _id: false });

// ─── Main schema ─────────────────────────────────────────────────────────────

export interface IPolicyRule extends Document {
  companyId:        mongoose.Types.ObjectId;
  name:             string;
  description:      string | null;
  priority:         number;             // Lower number = higher priority. 1 runs before 10.
  active:           boolean;
  conditionLogic:   ConditionLogic;     // AND: all must match. OR: any must match.
  conditions:       any[];
  steps:            any[];
  isDefault:        boolean;            // One rule per company can be the default/fallback
  fallbackBehavior: FallbackBehavior;   // Only used when isDefault=true and nothing else matches
  minApprovalPercent: number;           // 0-100. 0 = all steps must approve. 50 = majority.
  createdAt:        Date;
  updatedAt:        Date;
}

const PolicyRuleSchema = new Schema({
  companyId:          { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name:               { type: String, required: true },
  description:        { type: String, default: null },
  priority:           { type: Number, required: true, default: 100 },
  active:             { type: Boolean, default: true },
  conditionLogic:     { type: String, enum: Object.values(ConditionLogic), default: ConditionLogic.AND },
  conditions:         { type: [ConditionSchema], default: [] },
  steps:              { type: [PolicyStepSchema], default: [] },
  isDefault:          { type: Boolean, default: false },
  fallbackBehavior:   { type: String, enum: Object.values(FallbackBehavior), default: FallbackBehavior.AUTO_APPROVE },
  minApprovalPercent: { type: Number, min: 0, max: 100, default: 0 },
}, { timestamps: true });

PolicyRuleSchema.index({ companyId: 1, priority: 1, active: 1 });
PolicyRuleSchema.index({ companyId: 1, isDefault: 1 });

export default mongoose.models.PolicyRule ||
  mongoose.model<IPolicyRule>('PolicyRule', PolicyRuleSchema);


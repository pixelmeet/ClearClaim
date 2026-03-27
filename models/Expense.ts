import mongoose, { Schema, Model, Document } from 'mongoose';
import { ExpenseCategory, ExpenseStatus } from '@/lib/types';

export interface IChainStep {
    stepIndex: number;
    approverId?: string;
    role?: string;
    required?: boolean;
    autoApprove?: boolean;
    label?: string;
}

export interface IExpense extends Document {
    companyId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    approvalFlowId?: mongoose.Types.ObjectId;
    policyRuleId?: mongoose.Types.ObjectId | null;
    amountOriginal: number;
    currencyOriginal: string;
    amountCompany: number;
    companyCurrency: string;
    fxRate: number;
    fxRateCached?: boolean;
    fxDate: Date;
    receiptUrl?: string | null;
    category: ExpenseCategory;
    description: string;
    expenseDate: Date;
    status: ExpenseStatus;
    currentStepIndex: number;
    resolvedChain?: IChainStep[];
    isAutoApproved?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        approvalFlowId: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow' },
        policyRuleId: { type: Schema.Types.ObjectId, ref: 'PolicyRule', default: null },
        amountOriginal: { type: Number, required: true },
        currencyOriginal: { type: String, required: true },
        amountCompany: { type: Number, required: true },
        companyCurrency: { type: String, required: true },
        fxRate: { type: Number, required: true },
        fxRateCached: { type: Boolean, default: false },
        fxDate: { type: Date, required: true },
        receiptUrl: { type: String, default: null },
        category: { type: String, enum: Object.values(ExpenseCategory), required: true },
        description: { type: String, required: true },
        expenseDate: { type: Date, required: true },
        status: { type: String, enum: Object.values(ExpenseStatus), default: ExpenseStatus.DRAFT },
        currentStepIndex: { type: Number, default: 0 },
        resolvedChain: [{
            stepIndex:    { type: Number, required: true },
            approverType: { type: String, required: true },
            approverId:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
            approverRole: { type: String, default: null },
            required:     { type: Boolean, default: true },
            autoApprove:  { type: Boolean, default: false },
            label:        { type: String, default: null },
            _id:          false,
        }],
        isAutoApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ExpenseSchema.index({ companyId: 1, employeeId: 1 });
ExpenseSchema.index({ companyId: 1, status: 1 });
ExpenseSchema.index({ companyId: 1, employeeId: 1, status: 1 });
ExpenseSchema.index({ companyId: 1, createdAt: -1 });

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
export { ExpenseCategory, ExpenseStatus };

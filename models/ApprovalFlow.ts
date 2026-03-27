import mongoose, { Schema, Model, Document } from 'mongoose';
import { ExpenseCategory, UserRole, StepType } from '@/lib/types';

export interface IApprovalStep {
    type: StepType;
    role?: UserRole;
    userId?: mongoose.Types.ObjectId;
    required?: boolean;
    autoApprove?: boolean;
}

export interface IApprovalFlow extends Document {
    companyId: mongoose.Types.ObjectId;
    name: string;
    category?: ExpenseCategory | null;
    isManagerApprover: boolean;
    minApprovalPercent: number;
    steps: IApprovalStep[];
    createdAt: Date;
    updatedAt: Date;
}

const ApprovalStepSchema = new Schema<IApprovalStep>({
    type: { type: String, enum: Object.values(StepType), required: true },
    role: { type: String, enum: Object.values(UserRole) },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    required: { type: Boolean, default: true },      // NEW — if false, step can be skipped
    autoApprove: { type: Boolean, default: false },     // NEW — if true, step auto-passes on init
    label: { type: String, default: null },       // NEW — human-readable step name
});

const ApprovalFlowSchema = new Schema<IApprovalFlow>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        name: { type: String, required: true, trim: true },
        category: {                                // NEW — null means "default flow"
            type: String,
            enum: [...Object.values(ExpenseCategory), null],
            default: null,
        },
        isManagerApprover: { type: Boolean, default: true },
        minApprovalPercent: { type: Number, min: 0, max: 100, default: 100 },
        steps: {
            type: [ApprovalStepSchema],
            validate: {
                validator: (v: IApprovalStep[]) => v.length >= 1,
                message: 'At least one approval step is required.',
            },
        },
    },
    { timestamps: true }
);

// Unique flow name per company
ApprovalFlowSchema.index({ companyId: 1, name: 1 }, { unique: true });
ApprovalFlowSchema.index({ companyId: 1, category: 1 });

// Pre-save validation: required + autoApprove cannot both be true
ApprovalFlowSchema.pre('save', function () {
    for (const step of this.steps) {
        if (step.required && step.autoApprove) {
            throw new Error('A step cannot be both required and autoApprove.');
        }
        if (step.type === StepType.USER && !step.userId) {
            throw new Error('USER step must have a userId.');
        }
        if (step.type === StepType.ROLE && !step.role) {
            throw new Error('ROLE step must have a role.');
        }
    }
});

const ApprovalFlow: Model<IApprovalFlow> = mongoose.models.ApprovalFlow || mongoose.model<IApprovalFlow>('ApprovalFlow', ApprovalFlowSchema);

export default ApprovalFlow;
export { StepType };

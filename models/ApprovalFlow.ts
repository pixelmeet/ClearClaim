import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserRole, StepType } from '@/lib/types';

export interface IApprovalStep {
    type: StepType;
    role?: UserRole;
    userId?: mongoose.Types.ObjectId;
}

export interface IApprovalFlow extends Document {
    companyId: mongoose.Types.ObjectId;
    name: string;
    isManagerApprover: boolean;
    steps: IApprovalStep[];
    createdAt: Date;
    updatedAt: Date;
}

const ApprovalStepSchema = new Schema<IApprovalStep>({
    type: { type: String, enum: Object.values(StepType), required: true },
    role: { type: String, enum: Object.values(UserRole) },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const ApprovalFlowSchema = new Schema<IApprovalFlow>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        name: { type: String, required: true },
        isManagerApprover: { type: Boolean, default: true },
        steps: [ApprovalStepSchema],
    },
    { timestamps: true }
);

const ApprovalFlow: Model<IApprovalFlow> = mongoose.models.ApprovalFlow || mongoose.model<IApprovalFlow>('ApprovalFlow', ApprovalFlowSchema);

export default ApprovalFlow;
export { StepType };

import mongoose, { Schema, Model, Document } from 'mongoose';
import { ActionType } from '@/lib/types';

export interface IApprovalAction extends Document {
    expenseId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    stepIndex: number;
    approverId: mongoose.Types.ObjectId;
    action: ActionType;
    comment?: string;
    createdAt: Date;
}

const ApprovalActionSchema = new Schema<IApprovalAction>(
    {
        expenseId: { type: Schema.Types.ObjectId, ref: 'Expense', required: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        stepIndex: { type: Number, required: true },
        approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, enum: Object.values(ActionType), required: true },
        comment: { type: String },
    },
    { timestamps: true }
);

ApprovalActionSchema.index({ expenseId: 1, createdAt: -1 });
ApprovalActionSchema.index({ companyId: 1, approverId: 1 });

const ApprovalAction: Model<IApprovalAction> = mongoose.models.ApprovalAction || mongoose.model<IApprovalAction>('ApprovalAction', ApprovalActionSchema);

export default ApprovalAction;
export { ActionType };

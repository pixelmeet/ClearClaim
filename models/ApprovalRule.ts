import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IApprover {
    user: mongoose.Types.ObjectId;
    required: boolean;
    sequenceNo: number;
    autoApprove: boolean;
}

export interface IApprovalRule extends Document {
    organization: string;
    ruleName?: string;
    description?: string;
    appliesToUser?: mongoose.Types.ObjectId;
    manager?: mongoose.Types.ObjectId;
    isManagerApprover: boolean;
    approverSequence: boolean;
    minApprovalPercent: number;
    approvers: IApprover[];
    createdAt: Date;
}

const ApproverSchema = new Schema<IApprover>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        required: { type: Boolean, default: false },
        sequenceNo: { type: Number, default: 0 },
        autoApprove: { type: Boolean, default: false },
    },
    { _id: false }
);

const ApprovalRuleSchema = new Schema<IApprovalRule>({
    organization: { type: String, required: true, trim: true },
    ruleName: { type: String, trim: true },
    description: { type: String, trim: true },
    appliesToUser: { type: Schema.Types.ObjectId, ref: 'User' },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    isManagerApprover: { type: Boolean, default: false },
    approverSequence: { type: Boolean, default: false },
    minApprovalPercent: { type: Number, default: 100, min: 0, max: 100 },
    approvers: [ApproverSchema],
    createdAt: { type: Date, default: Date.now },
});

const ApprovalRule: Model<IApprovalRule> =
    mongoose.models.ApprovalRule ||
    mongoose.model<IApprovalRule>('ApprovalRule', ApprovalRuleSchema);

export default ApprovalRule;

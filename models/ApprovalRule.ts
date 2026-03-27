import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@/lib/types';

export enum RuleType {
    SPECIFIC_APPROVER = 'SPECIFIC_APPROVER',
    PERCENTAGE = 'PERCENTAGE',
    HYBRID = 'HYBRID',
}

export enum RuleLogic {
    AND = 'AND',
    OR = 'OR',
}

export interface IApprovalRule extends Document {
    organization: mongoose.Types.ObjectId;
    ruleName: string;
    appliesToUser?: mongoose.Types.ObjectId | null;
    isManagerApprover: boolean;
    minApprovalPercent?: number;
    ruleType: RuleType;
    ruleLogic: RuleLogic;
    approvers: Array<{
        user: mongoose.Types.ObjectId;
        sequenceNo?: number;
        required?: boolean;
        autoApprove?: boolean;
    }>;
}

const ApprovalRuleSchema = new Schema<IApprovalRule>(
    {
        organization: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true,
        },
        ruleName: { type: String, required: true },
        appliesToUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        isManagerApprover: { type: Boolean, default: false },
        minApprovalPercent: { type: Number, default: 100 },
        ruleType: { type: String, enum: Object.values(RuleType), default: RuleType.SPECIFIC_APPROVER },
        ruleLogic: { type: String, enum: Object.values(RuleLogic), default: RuleLogic.OR },
        approvers: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                sequenceNo: { type: Number, default: 0 },
                required: { type: Boolean, default: true },
                autoApprove: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.models.ApprovalRule || mongoose.model<IApprovalRule>('ApprovalRule', ApprovalRuleSchema);

import mongoose, { Schema, Model, Document } from 'mongoose';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface IApprovalRequest extends Document {
    organization: string;
    approvalSubject: string;
    requestOwner: mongoose.Types.ObjectId;
    category: string;
    requestStatus: ApprovalStatus;
    totalAmount: number;
    currency: string;
    convertedAmount?: number;
    convertedCurrency?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>(
    {
        organization: { type: String, required: true, trim: true },
        approvalSubject: { type: String, required: true, trim: true },
        requestOwner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        category: { type: String, required: true, trim: true },
        requestStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        totalAmount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, trim: true },
        convertedAmount: { type: Number },
        convertedCurrency: { type: String, trim: true },
        description: { type: String, trim: true },
    },
    { timestamps: true }
);

const ApprovalRequest: Model<IApprovalRequest> =
    mongoose.models.ApprovalRequest ||
    mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);

export default ApprovalRequest;

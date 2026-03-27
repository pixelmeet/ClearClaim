import mongoose, { Schema, Document } from 'mongoose';

export interface IThresholdRule extends Document {
  companyId: mongoose.Types.ObjectId;
  minAmount: number;
  userId: mongoose.Types.ObjectId; // User to inject into the chain
  label: string;
  active: boolean;
}

const ThresholdRuleSchema = new Schema<IThresholdRule>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  minAmount: { type: Number, required: true },
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label:     { type: String, default: 'High Value Scrutiny' },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.ThresholdRule || mongoose.model<IThresholdRule>('ThresholdRule', ThresholdRuleSchema);

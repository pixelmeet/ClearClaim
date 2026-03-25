import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFxRate extends Document {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fetchedAt: Date;
}

const FxRateSchema = new Schema<IFxRate>({
  fromCurrency: { type: String, required: true },
  toCurrency: { type: String, required: true },
  rate: { type: Number, required: true },
  fetchedAt: { type: Date, required: true },
});

FxRateSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

const FxRate: Model<IFxRate> =
  mongoose.models.FxRate || mongoose.model<IFxRate>('FxRate', FxRateSchema);

export default FxRate;

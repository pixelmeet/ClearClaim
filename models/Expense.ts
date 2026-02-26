import mongoose, { Schema, Model, Document } from 'mongoose';
import { ExpenseCategory, ExpenseStatus } from '@/lib/types';

export interface IExpense extends Document {
    companyId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    amountOriginal: number;
    currencyOriginal: string;
    amountCompany: number;
    companyCurrency: string;
    fxRate: number;
    fxDate: Date;
    category: ExpenseCategory;
    description: string;
    expenseDate: Date;
    status: ExpenseStatus;
    currentStepIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amountOriginal: { type: Number, required: true },
        currencyOriginal: { type: String, required: true },
        amountCompany: { type: Number, required: true },
        companyCurrency: { type: String, required: true },
        fxRate: { type: Number, required: true },
        fxDate: { type: Date, required: true },
        category: { type: String, enum: Object.values(ExpenseCategory), required: true },
        description: { type: String, required: true },
        expenseDate: { type: Date, required: true },
        status: { type: String, enum: Object.values(ExpenseStatus), default: ExpenseStatus.DRAFT },
        currentStepIndex: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
export { ExpenseCategory, ExpenseStatus };

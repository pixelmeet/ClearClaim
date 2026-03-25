import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ICompany extends Document {
    name: string;
    nameLower: string;
    country: string;
    defaultCurrency: string;
    address?: string;
    branches?: string[];
    website?: string;
    taxId?: string;
    contactEmail?: string;
    contactPhone?: string;
    createdAt: Date;
    updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>(
    {
        name: { type: String, required: true },
        nameLower: { type: String, required: true, unique: true },
        country: { type: String, required: true },
        defaultCurrency: { type: String, required: true },
        address: { type: String },
        branches: [{ type: String }],
        website: { type: String },
        taxId: { type: String },
        contactEmail: { type: String },
        contactPhone: { type: String },
    },
    { timestamps: true }
);

// Auto-populate nameLower for backward compatibility
CompanySchema.pre('save', async function () {
    if (this.isModified('name') && this.name) {
        this.nameLower = this.name.trim().toLowerCase();
    }
});

// In development, delete the cached model so hot-reload always picks up
// the latest schema/middleware instead of a stale compiled model.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Company) {
    delete mongoose.models.Company;
}

const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;

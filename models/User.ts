import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserRole } from '@/lib/types';

export interface IUser extends Document {
    companyId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    otp?: string | null;
    otpExpires?: Date | null;
    otpPurpose?: 'signup' | 'password_reset' | null;
    role: UserRole;
    department?: string | null;
    managerId?: mongoose.Types.ObjectId;
    delegatedTo?: mongoose.Types.ObjectId | null;
    delegationExpiresAt?: Date | null;
    isDisabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        passwordHash: { type: String, required: true },
        otp: { type: String, default: null },
        otpExpires: { type: Date, default: null },
        otpPurpose: { type: String, enum: ['signup', 'password_reset'], default: null },
        role: { type: String, enum: Object.values(UserRole), default: UserRole.EMPLOYEE },
        department: { type: String, default: null },
        managerId: { type: Schema.Types.ObjectId, ref: 'User' },
        delegatedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        delegationExpiresAt: { type: Date, default: null },
        isDisabled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Unique combination of companyId + email (multi-tenant)
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });
UserSchema.index({ companyId: 1, managerId: 1 });
UserSchema.index({ companyId: 1, role: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
export { UserRole }; // Re-export for convenience in server-side code if needed

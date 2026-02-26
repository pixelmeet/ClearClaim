import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserRole } from '@/lib/types';

export interface IUser extends Document {
    companyId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    managerId?: mongoose.Types.ObjectId;
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
        role: { type: String, enum: Object.values(UserRole), default: UserRole.EMPLOYEE },
        managerId: { type: Schema.Types.ObjectId, ref: 'User' },
        isDisabled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Unique combination of companyId + email (multi-tenant)
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
export { UserRole }; // Re-export for convenience in server-side code if needed

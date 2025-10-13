import { UserRole } from "./roles";

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  otp?: string | null;
  otpExpires?: number | null;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  otp?: string | null;
  otpExpires?: number | null;
}

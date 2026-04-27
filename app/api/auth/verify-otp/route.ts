import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import { createSessionCookie } from "@/lib/auth/createSessionCookie";
import { UserRole } from "@/lib/types";
import { getRoleHomePath } from "@/lib/auth/postLoginRedirect";
import { timingSafeEqual } from "crypto";
import { clientKeyFromRequest, rateLimit } from "@/lib/rateLimit";

function safeCompareOtp(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailForRateLimit = String(body?.email ?? "").trim().toLowerCase();
    const rl = rateLimit(
      `verify-otp:${emailForRateLimit}:${clientKeyFromRequest(request)}`,
      5,
      15 * 60 * 1000
    );
    if (!rl.ok) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const { email, otp, flow = "password_reset" } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user || !user.otp || !user.otpExpires || user.otpPurpose !== flow) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    if (Date.now() > new Date(user.otpExpires).getTime()) {
      // Enforce "no account without OTP verification" for signup flow.
      if (flow === "signup") {
        const companyId = user.companyId;
        await User.deleteOne({ _id: user._id });
        const remainingUsers = await User.countDocuments({ companyId });
        if (remainingUsers === 0) {
          await Company.deleteOne({ _id: companyId });
        }
      }
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    if (!safeCompareOtp(user.otp, String(otp))) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    if (flow === "signup") {
      user.otp = null;
      user.otpExpires = null;
      user.otpPurpose = null;
      await user.save();

      await createSessionCookie({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        companyId: user.companyId.toString(),
      });

      const redirectTo = getRoleHomePath(user.role as UserRole);
      return NextResponse.json(
        { message: "Account verified successfully", redirectTo },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "OTP verified" }, { status: 200 });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
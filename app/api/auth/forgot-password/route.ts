import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = otp;
      user.otpExpires = otpExpires;
      user.otpPurpose = "password_reset";
      await user.save();

      try {
        await sendOTPEmail(user.email, otp, "password_reset");
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return NextResponse.json(
          { message: "Failed to send email" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "If an account exists, an OTP has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
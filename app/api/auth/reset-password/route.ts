import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email, otp, password } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired session" },
        { status: 400 }
      );
    }

    if (
      !user.otp ||
      user.otp !== otp ||
      user.otpPurpose !== "password_reset" ||
      !user.otpExpires ||
      Date.now() > new Date(user.otpExpires).getTime()
    ) {
      return NextResponse.json(
        { message: "Invalid or expired session" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    user.otp = null;
    user.otpExpires = null;
    user.otpPurpose = null;
    await user.save();

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
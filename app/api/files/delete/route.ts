import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import connectToDatabase from "@/lib/db";
import Expense from "@/models/Expense";
import { UserRole } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { publicId } = (await req.json()) as { publicId?: string };
    if (!publicId) {
      return NextResponse.json({ message: "publicId is required" }, { status: 400 });
    }

    if (publicId.startsWith("/uploads/")) {
      return NextResponse.json({ result: "ok" }, { status: 200 });
    }

    if (!isCloudinaryConfigured()) {
      console.error("Missing Cloudinary env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
      return NextResponse.json({ error: "File storage is not configured" }, { status: 503 });
    }

    await connectToDatabase();
    const escapedPublicId = publicId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const scopedExpense = await Expense.findOne({
      companyId: session.companyId,
      receiptUrl: { $regex: escapedPublicId, $options: "i" },
      ...(session.role === UserRole.EMPLOYEE ? { employeeId: session.userId } : {}),
    }).select("_id");

    if (!scopedExpense) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ result: "ok" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

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
      console.error("Missing Cloudinary env: CLOUD_NAME, API_KEY, API_SECRET");
      return NextResponse.json({ error: "File storage is not configured" }, { status: 503 });
    }

    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ result: "ok" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}

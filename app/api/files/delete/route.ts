import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { publicId } = (await req.json()) as { publicId?: string };
    if (!publicId) {
      return NextResponse.json({ message: "publicId is required" }, { status: 400 });
    }

    if (publicId.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", publicId);
      await fs.unlink(filePath).catch((e) => {
        console.error("Failed to delete file from disk:", e);
      });
    }

    return NextResponse.json({ result: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Delete file error:", err);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}

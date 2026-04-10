import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserRole } from "@/lib/types";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

function sanitizeFolderPrefix(folder: string): string | null {
  const trimmed = folder.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed || trimmed.includes("..")) {
    return null;
  }
  if (trimmed.split("/").some((segment) => segment === "..")) {
    return null;
  }
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { folder } = (await req.json()) as { folder?: string };
    if (!folder) {
      return NextResponse.json({ message: "folder is required" }, { status: 400 });
    }

    const prefix = sanitizeFolderPrefix(folder);
    if (!prefix) {
      return NextResponse.json({ message: "Invalid folder path" }, { status: 400 });
    }

    if (!isCloudinaryConfigured()) {
      console.error("Missing Cloudinary env: CLOUD_NAME, API_KEY, API_SECRET");
      return NextResponse.json({ error: "File storage is not configured" }, { status: 503 });
    }

    await new Promise<void>((resolve, reject) => {
      cloudinary.api.delete_resources_by_prefix(prefix, (error: unknown) => {
        if (error) reject(error);
        else resolve();
      });
    });

    return NextResponse.json({ result: "ok" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete folder failed" }, { status: 500 });
  }
}

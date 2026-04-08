import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { UserRole } from "@/lib/types";

const UPLOADS_BASE = path.join(process.cwd(), "public", "uploads");

function resolveSafeUploadDir(folder: string): string | null {
  const trimmed = folder.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed || trimmed.includes("..")) {
    return null;
  }
  const target = path.resolve(UPLOADS_BASE, ...trimmed.split(path.sep).filter(Boolean));
  const baseResolved = path.resolve(UPLOADS_BASE);
  const rel = path.relative(baseResolved, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return target;
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

    const targetDir = resolveSafeUploadDir(folder);
    if (!targetDir) {
      return NextResponse.json({ message: "Invalid folder path" }, { status: 400 });
    }

    await fs.rm(targetDir, { recursive: true, force: true });

    return NextResponse.json({ result: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Delete folder error:", err);
    return NextResponse.json(
      { message: "Delete folder failed" },
      { status: 500 }
    );
  }
}

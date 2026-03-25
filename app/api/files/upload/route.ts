import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit(`files-upload:${session.userId}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const formData = await req.formData();

    const folder = (formData.get("folder") as string) || "uploads";

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "file" || key.startsWith("file")) {
        if (value instanceof File) files.push(value);
      }
    }

    if (!files.length) {
      return NextResponse.json(
        { message: "No files provided. Use 'file' field(s) in multipart/form-data." },
        { status: 400 }
      );
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
        await fs.mkdir(uploadDir, { recursive: true });

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.name);
        const filename = `${file.name.replace(ext, "")}-${uniqueSuffix}${ext}`;

        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, buffer);

        const url = `/uploads/${folder}/${filename}`;

        return { filename: file.name, url, public_id: url };
      })
    );

    return NextResponse.json({ uploads }, { status: 200 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

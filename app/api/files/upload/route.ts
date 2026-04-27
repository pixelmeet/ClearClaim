import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Next.js Route Handlers use the Web Request API (multipart via FormData), not Express `req.file`.
 * Files are read into a Buffer in memory only — equivalent to multer's `memoryStorage()` (no disk).
 */
function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder: string }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: options.folder },
      (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error("Cloudinary returned no result"));
        else resolve(result as { secure_url: string; public_id: string });
      }
    ).end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isCloudinaryConfigured()) {
      console.error("Missing Cloudinary env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
      return NextResponse.json(
        { error: "File upload is not configured" },
        { status: 503 }
      );
    }

    const rl = rateLimit(`files-upload:${session.userId}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const formData = await req.formData();
    const folder = ((formData.get("folder") as string) || "uploads")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "file" || key.startsWith("file")) {
        if (value instanceof File && value.size > 0) files.push(value);
      }
    }

    if (!files.length) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        if (!ALLOWED_TYPES.has(file.type)) {
          throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
        }
        if (file.size > MAX_UPLOAD_SIZE) {
          throw new Error("File too large (max 20 MB)");
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadBufferToCloudinary(buffer, { folder });
        return {
          filename: file.name,
          url: result.secure_url,
          public_id: result.public_id,
        };
      })
    );

    const first = uploads[0]!;

    return NextResponse.json(
      {
        success: true,
        fileUrl: first.url,
        publicId: first.public_id,
        uploads: uploads.map((u) => ({
          filename: u.filename,
          url: u.url,
          public_id: u.public_id,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = /too large/i.test(message) ? 413 : /Unsupported file type/i.test(message) ? 415 : 500;
    console.error(error);
    return NextResponse.json({ error: message }, { status });
  }
}

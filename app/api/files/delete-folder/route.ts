import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { getSession } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== UserRole.ADMIN)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { folder } = (await req.json()) as { folder?: string };
    if (!folder) {
      return NextResponse.json(
        { message: "folder is required" },
        { status: 400 }
      );
    }

    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: folder + "/",
      max_results: 500,
    });

    if (resources.resources.length) {
      const publicIds = resources.resources.map((r: { public_id: string }) => r.public_id);
      await cloudinary.api.delete_resources(publicIds);
    }

    const res = await cloudinary.api.delete_folder(folder);
    return NextResponse.json({ result: res }, { status: 200 });
  } catch (err) {
    console.error("Delete folder error:", err);
    return NextResponse.json(
      { message: "Delete folder failed" },
      { status: 500 }
    );
  }
}

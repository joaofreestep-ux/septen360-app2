import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");

  if (!uuid) {
    return NextResponse.json({ error: "UUID obrigatório" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "videos", `${uuid}.mp4`);
  const exists = fs.existsSync(filePath);

  const status = exists ? "done" : "processing";

  return NextResponse.json(
    { exists, status },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    if (!uuid || typeof uuid !== "string") {
      return NextResponse.json({ error: "UUID inválido" }, { status: 400 });
    }

    const videoPath = path.join(process.cwd(), "public", "videos", `${uuid}.mp4`);

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(videoPath);
    const fileName = `video_${uuid}.mp4`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Erro no download:", error);
    return NextResponse.json({ error: "Erro ao fazer download" }, { status: 500 });
  }
}

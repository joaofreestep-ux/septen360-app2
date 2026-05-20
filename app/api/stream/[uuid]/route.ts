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

    const videoPath = path.join(process.cwd(), "public", "output_final", `${uuid}_final.mp4`);

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      const start = match?.[1] ? parseInt(match[1], 10) : 0;
      const end = match?.[2] ? parseInt(match[2], 10) : fileSize - 1;
      const safeEnd = Math.min(end, fileSize - 1);

      if (Number.isNaN(start) || Number.isNaN(safeEnd) || start > safeEnd) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = safeEnd - start + 1;
      const stream = fs.createReadStream(videoPath, { start, end: safeEnd });

      return new NextResponse(stream as unknown as BodyInit, {
        status: 206,
        headers: {
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Range": `bytes ${start}-${safeEnd}/${fileSize}`,
          "Content-Disposition": `inline; filename="video_${uuid}.mp4"`,
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }

    const stream = fs.createReadStream(videoPath);

    return new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize.toString(),
        "Content-Disposition": `inline; filename="video_${uuid}.mp4"`,
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Erro no stream:", error);
    return NextResponse.json({ error: "Erro ao abrir vídeo" }, { status: 500 });
  }
}
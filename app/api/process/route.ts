import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { videoQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uuid } = await req.json();

    if (!uuid || typeof uuid !== "string") {
      return NextResponse.json({ error: "UUID inválido" }, { status: 400 });
    }

    if (!videoQueue) {
      return NextResponse.json({ error: "Fila indisponível (Redis offline)" }, { status: 503 });
    }

    const uploadPath = path.join(process.cwd(), "public", "uploads", `${uuid}.webm`);
    const outputPath = path.join(process.cwd(), "public", "output_final", `${uuid}_final.mp4`);

    if (!fs.existsSync(uploadPath)) {
      return NextResponse.json({ error: "Arquivo de upload não encontrado" }, { status: 404 });
    }

    console.log("🔥 Enviando job para fila: video");

    const job = await videoQueue.add("process-video", { uuid, inputPath: uploadPath, outputPath }, {
      jobId: uuid,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    });

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error("❌ ERRO /api/process:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

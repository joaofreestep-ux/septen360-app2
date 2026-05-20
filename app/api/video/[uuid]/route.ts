import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { videoQueue } from "@/lib/queue";

export const runtime = "nodejs";

function resolveVideoPaths(uuid: string) {
  const uploadPath = path.join(process.cwd(), "public", "uploads", `${uuid}.webm`);
  const outputPath = path.join(process.cwd(), "public", "output_final", `${uuid}_final.mp4`);

  return {
    uploadPath,
    outputPath,
  };
}

export const dynamic = "force-dynamic";

export async function HEAD(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const { outputPath } = resolveVideoPaths(uuid);

    if (fs.existsSync(outputPath)) {
      return new Response(null, { status: 200 });
    }

    return new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    if (!videoQueue) {
      return NextResponse.json({ error: "Fila indisponivel (Redis offline)" }, { status: 503 });
    }

    const { uuid } = await params;
    const { uploadPath, outputPath } = resolveVideoPaths(uuid);

    if (!fs.existsSync(uploadPath)) {
      return NextResponse.json({ error: "Arquivo de upload não encontrado" }, { status: 404 });
    }

    let job = (await videoQueue.getJob(uuid)) ?? null;

    if (job) {
      const state = await job.getState();
      if (state === "failed") {
        await job.remove();
        job = null;
      }
    }

    if (job === null) {
      console.log("🔥 Enviando job para fila: video");
      job = await videoQueue.add("process-video", { uuid, inputPath: uploadPath, outputPath }, {
        jobId: uuid,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      });

      if (!job) {
        throw new Error("Falha ao criar job");
      }
    }

    return NextResponse.json({ started: true, uuid, jobId: job.id });
  } catch (err) {
    console.error("🔥 ERRO POST /api/video:", err);
    return NextResponse.json({ error: "Erro ao iniciar processamento" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const { outputPath } = resolveVideoPaths(uuid);

    if (!fs.existsSync(outputPath)) {
      return new NextResponse("Video ainda nao pronto", { status: 404 });
    }

    const stats = fs.statSync(outputPath);
    const nodeStream = fs.createReadStream(outputPath);
    const stream = Readable.toWeb(nodeStream) as unknown as BodyInit;

    return new Response(stream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": stats.size.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "no-cache",
      },
    });

  } catch (err) {
    console.error("🔥 ERRO FINAL:", err);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

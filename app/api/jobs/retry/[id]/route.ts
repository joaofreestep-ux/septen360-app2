import { NextResponse } from "next/server";
import { videoQueue } from "@/lib/queue";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!videoQueue) {
    return NextResponse.json({ error: "Fila indisponível (Redis offline)" }, { status: 503 });
  }

  const job = await videoQueue.getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" });
  }

  await job.retry();

  return NextResponse.json({ ok: true });
}

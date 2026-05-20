import { NextResponse } from "next/server";
import { videoQueue } from "@/lib/queue";

export async function GET() {
  if (!videoQueue) {
    return NextResponse.json({ error: "Fila indisponível (Redis offline)" }, { status: 503 });
  }

  const jobs = await videoQueue.getJobs([
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
  ]);

  const formatted = await Promise.all(
    jobs.map(async (job) => ({
      id: job.id,
      name: job.name,
      progress: job.progress || 0,
      state: await job.getState(),
      data: job.data,
    }))
  );

  return NextResponse.json(formatted);
}

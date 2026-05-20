import { NextResponse } from "next/server";
import { videoQueue } from "@/lib/queue";

export async function POST() {
  if (!videoQueue) {
    return NextResponse.json({ error: "Fila indisponível (Redis offline)" }, { status: 503 });
  }

  await videoQueue.drain();
  await videoQueue.clean(0, 1000, "failed");
  await videoQueue.clean(0, 1000, "delayed");

  return NextResponse.json({ ok: true });
}

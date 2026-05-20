import { NextResponse } from "next/server";
import { videoQueue } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accept = req.headers.get("accept") || "";

  if (!videoQueue) {
    return NextResponse.json({ error: "Fila indisponível (Redis offline)" }, { status: 503 });
  }

  const queue = videoQueue;

  if (accept.includes("text/event-stream")) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let closed = false;

        const stop = () => {
          if (closed) return;
          closed = true;
          clearInterval(interval);
          controller.close();
        };

        const safeEnqueue = (payload: string) => {
          if (closed) return;
          controller.enqueue(encoder.encode(payload));
        };

        const interval = setInterval(async () => {
          try {
            const job = await queue.getJob(id);

            if (!job) {
              safeEnqueue(`data: ${JSON.stringify({ error: "Job não encontrado" })}\n\n`);
              stop();
              return;
            }

            const state = await job.getState();
            const progress = job.progress || 0;

            safeEnqueue(
              `data: ${JSON.stringify({
                progress,
                state,
                done: state === "completed",
                error: state === "failed",
              })}\n\n`
            );

            if (state === "completed" || state === "failed") {
              stop();
            }
          } catch (error) {
            console.error("🔥 SSE Error:", error);
            safeEnqueue(`data: ${JSON.stringify({ error: "Erro interno no SSE" })}\n\n`);
            stop();
          }
        }, 500);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const job = await videoQueue.getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  const state = await job.getState();

  return NextResponse.json({
    state,
    progress: job.progress,
  });
}

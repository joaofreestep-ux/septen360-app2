import { exec } from "child_process";
import path from "path";
import { NextResponse } from "next/server";
import { logError } from "@/lib/systemLogs";

let lastRestartAt = 0;

export async function POST() {
  try {
    const now = Date.now();

    if (now - lastRestartAt < 10000) {
      return NextResponse.json({ ok: true, skipped: true, reason: "cooldown" });
    }

    const command = process.env.PROCESS_RESTART_COMMAND || "node worker/videoWorker.js";

    exec(command, { cwd: path.join(process.cwd()) }, (error) => {
      if (error) {
        logError(`Erro ao reiniciar processamento: ${error.message}`);
      }
    });

    lastRestartAt = now;
    return NextResponse.json({ ok: true, command });
  } catch (error) {
    logError("Erro no endpoint de restart");
    return NextResponse.json({ error: "Falha ao reiniciar" }, { status: 500 });
  }
}

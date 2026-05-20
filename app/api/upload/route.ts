import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    console.log("🚀 Upload iniciado");

    const data = await req.formData();
    const file = data.get("file");

    console.log("📦 File recebido:", file);

    if (!file || typeof file === "string") {
      console.error("❌ Nenhum arquivo recebido");
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    console.log("📦 Tamanho do arquivo:", file.size);

    const arrayBuffer = await file.arrayBuffer();
    console.log("📊 Tamanho buffer:", arrayBuffer.byteLength);

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error("❌ Buffer vazio");
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);

    const uuid = uuidv4();

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // 🔥 GARANTE QUE A PASTA EXISTE
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${uuid}.webm`);

    await writeFile(filePath, buffer);

    console.log("✅ Salvo em:", filePath);

    return new Response(
      JSON.stringify({ success: true, uuid }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (err: unknown) {
    console.error("💥 ERRO REAL DO UPLOAD:", err);

    const message = err instanceof Error ? err.message : "Upload failed";

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

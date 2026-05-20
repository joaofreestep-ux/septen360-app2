import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { addLead } from "@/lib/stats";
import { saveLead } from "@/lib/leads";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, phone, whatsapp, email, uuid, acceptedLGPD, acceptedImage } = body ?? {};
    const normalizedPhone = String(phone ?? whatsapp ?? "").trim();

    if (!normalizedPhone) {
      console.warn("Lead sem telefone", { name, email, uuid });
    }

    addLead();
    saveLead({
      name,
      phone: normalizedPhone,
      whatsapp: normalizedPhone,
      email,
      uuid,
      acceptedLGPD,
      acceptedImage,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "leads.json");

  if (!fs.existsSync(filePath)) {
    return NextResponse.json([]);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return NextResponse.json(data);
}

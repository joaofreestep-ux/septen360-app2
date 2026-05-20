import { NextResponse } from "next/server";
import { addSale } from "@/lib/stats";

export async function POST(req: Request) {
  const body = await req.json();

  if (body.type === "payment") {
    addSale();
  }

  return NextResponse.json({ ok: true });
}

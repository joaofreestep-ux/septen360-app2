import { NextResponse } from "next/server";
import { addSale } from "@/lib/stats";

export async function POST() {
  addSale();
  return NextResponse.json({ ok: true });
}

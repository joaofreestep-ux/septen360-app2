import { NextResponse } from "next/server";
import { getTechnicalLogs } from "@/lib/systemLogs";

export async function GET() {
  return NextResponse.json({ logs: getTechnicalLogs() });
}

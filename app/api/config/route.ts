import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/config";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export async function GET() {
  return NextResponse.json(readConfig());
}

export async function POST(req: Request) {
  const body = await req.json();
  const config = readConfig();

  config.public_base_url = normalizeBaseUrl(String(body?.public_base_url ?? ""));

  writeConfig(config);

  return NextResponse.json(config);
}

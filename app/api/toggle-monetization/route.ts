import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/config";

export async function POST() {
  const config = readConfig();

  config.is_monetized = !config.is_monetized;

  writeConfig(config);

  return NextResponse.json(config);
}

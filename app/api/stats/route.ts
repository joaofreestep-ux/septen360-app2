import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type RankingEntry = {
  name: string;
  count: number;
};

type LeadRecord = {
  name?: string;
  nome?: string;
  phone?: string;
  whatsapp?: string;
};

export async function GET() {
  try {
    const videosPath = path.join(process.cwd(), "public", "videos");
    const leadsPath = path.join(process.cwd(), "data", "leads.json");

    const files = fs.existsSync(videosPath) ? fs.readdirSync(videosPath) : [];
    const videoFiles = files.filter((f) => f.endsWith(".mp4"));
    const leadsRaw = fs.existsSync(leadsPath)
      ? (JSON.parse(fs.readFileSync(leadsPath, "utf-8")) as unknown)
      : [];
    const leads = Array.isArray(leadsRaw) ? (leadsRaw as LeadRecord[]) : [];

    const rankingMap: Record<string, RankingEntry> = {};
    leads.forEach((lead: LeadRecord) => {
      const phone = String(lead?.phone ?? lead?.whatsapp ?? "").trim();
      if (!phone) return;

      if (!rankingMap[phone]) {
        rankingMap[phone] = {
          name: String(lead?.name ?? lead?.nome ?? "Participante").trim() || "Participante",
          count: 0,
        };
      }

      rankingMap[phone].count += 1;
    });

    const ranking = Object.values(rankingMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalVideos = videoFiles.length;
    const totalRevenue = totalVideos * 20;
    const totalLeads = leads.length;

    return NextResponse.json({
      totalVideos,
      totalRevenue,
      totalLeads,
      ranking,
    });
  } catch (err) {
    console.error("Erro stats:", err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

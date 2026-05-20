import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type LeadRecord = {
  nome?: string;
  name?: string;
  whatsapp?: string;
  uuid?: string;
  createdAt?: string;
};

function escapeCsvValue(value: unknown) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "leads.json");

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Sem dados", { status: 404 });
  }

  const rawLeads = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  const leads = Array.isArray(rawLeads) ? (rawLeads as LeadRecord[]) : [];

  const csv = [
    "Nome,WhatsApp,UUID,Data",
    ...leads.map(
      (lead: LeadRecord) =>
        [
          escapeCsvValue(lead.nome ?? lead.name),
          escapeCsvValue(lead.whatsapp),
          escapeCsvValue(lead.uuid),
          escapeCsvValue(lead.createdAt),
        ].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=leads.csv",
    },
  });
}

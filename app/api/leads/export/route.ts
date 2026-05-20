import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

type LeadRecord = {
  name?: string;
  nome?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
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
  const leadsPath = path.join(process.cwd(), "data", "leads.json");

  if (!fs.existsSync(leadsPath)) {
    return NextResponse.json({ error: "Sem leads" }, { status: 400 });
  }

  const rawLeads = JSON.parse(fs.readFileSync(leadsPath, "utf-8")) as unknown;
  const leads = Array.isArray(rawLeads) ? (rawLeads as LeadRecord[]) : [];

  const header = "Nome,Telefone,Email,Data\n";
  const rows = leads.map((lead: LeadRecord) => {
    const nome = lead?.name ?? lead?.nome ?? "";
    const telefone = lead?.phone ?? lead?.whatsapp ?? "";
    const email = lead?.email ?? "";
    const data = lead?.createdAt ?? "";

    return [
      escapeCsvValue(nome),
      escapeCsvValue(telefone),
      escapeCsvValue(email),
      escapeCsvValue(data),
    ].join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=leads.csv",
    },
  });
}

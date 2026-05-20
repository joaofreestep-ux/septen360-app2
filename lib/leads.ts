import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "leads.json");

type LeadInput = {
  name?: string;
  nome?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  uuid?: string | null;
  videoUuid?: string | null;
  acceptedLGPD?: boolean;
  acceptedImage?: boolean;
};

export function saveLead(data: LeadInput) {
  let leads: Record<string, unknown>[] = [];

  if (fs.existsSync(filePath)) {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    leads = Array.isArray(parsed) ? parsed : [];
  }

  const normalizedName = String(data?.name ?? data?.nome ?? "").trim();
  const normalizedPhone = String(data?.phone ?? data?.whatsapp ?? "").trim();
  const normalizedEmail = String(data?.email ?? "").trim();

  leads.push({
    ...data,
    name: normalizedName,
    nome: normalizedName,
    phone: normalizedPhone,
    whatsapp: normalizedPhone,
    email: normalizedEmail,
    uuid: data?.uuid ?? data?.videoUuid ?? null,
    createdAt: new Date().toISOString(),
  });

  fs.writeFileSync(filePath, JSON.stringify(leads, null, 2));
}

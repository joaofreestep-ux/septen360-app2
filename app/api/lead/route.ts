import { NextResponse } from "next/server";
import { addLead } from "@/lib/stats";
import { saveLead } from "@/lib/leads";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const { name, phone, whatsapp, email, uuid, acceptedLGPD, acceptedImage } = body ?? {};
		const normalizedPhone = String(phone ?? whatsapp ?? "").trim();

		// ✅ NÃO bloqueia o fluxo - apenas loga se faltar telefone
		if (!normalizedPhone) {
			console.warn("⚠️ Lead sem telefone:", { name, email, uuid });
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
		return NextResponse.json({ ok: true }); // ✅ Sempre retorna sucesso
	}
}

export async function GET() {
	return NextResponse.json([]);
}

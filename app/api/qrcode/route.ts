import QRCode from "qrcode";
import { readConfig } from "@/lib/config";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

function isLocalHostUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");

  if (!uuid) {
    return new Response("UUID obrigatório", { status: 400 });
  }

  const requestOrigin = new URL(req.url).origin;
  const envBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL || "");
  const configBaseUrl = normalizeBaseUrl(readConfig().public_base_url || "");

  const candidates = [envBaseUrl, configBaseUrl, requestOrigin].filter(Boolean);

  // If app is being accessed via IP/ngrok/domain, avoid accidentally emitting localhost QR links.
  const nonLocalCandidates = candidates.filter((item) => !isLocalHostUrl(item));
  const httpsNonLocalCandidate = nonLocalCandidates.find((item) => item.startsWith("https://"));
  const baseUrl = httpsNonLocalCandidate || nonLocalCandidates[0] || candidates[0] || requestOrigin;

  const url = `${baseUrl}/v?uuid=${uuid}`;

  const qrBuffer = await QRCode.toBuffer(url);
  const qrBytes = new Uint8Array(qrBuffer);

  return new Response(qrBytes, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}

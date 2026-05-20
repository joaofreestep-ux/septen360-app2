import { NextResponse } from "next/server";

export async function POST(_req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { message: "Pagamento real obrigatório em produção." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      qr_code_base64: "TESTE_OK",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

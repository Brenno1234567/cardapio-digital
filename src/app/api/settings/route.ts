import { NextResponse } from "next/server";
import { db } from "../../../db";
import { configuracoes } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isNextResponse } from "../../../lib/auth";

export async function GET() {
  try {
    const [config] = await db.select().from(configuracoes).limit(1);
    return NextResponse.json({ statusLoja: config?.statusLoja ?? true, tempoPreparo: config?.tempoPreparo ?? "30-45" });
  } catch {
    return NextResponse.json({ error: "Erro interno ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    const [existente] = await db.select().from(configuracoes).limit(1);
    const valores = { statusLoja: Boolean(body.statusLoja), tempoPreparo: String(body.tempoPreparo || "30-45") };
    if (!existente) {
      await db.insert(configuracoes).values({ id: "config-principal", nomeRestaurante: "", ...valores });
    } else {
      await db.update(configuracoes).set(valores).where(eq(configuracoes.id, existente.id));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno ao salvar configurações." }, { status: 500 });
  }
}

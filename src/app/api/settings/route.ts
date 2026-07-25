import { NextResponse } from "next/server";
import { db } from "../../../db";
import { configuracoes } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isNextResponse } from "../../../lib/auth";

export async function GET() {
  try {
    const config = await db.select().from(configuracoes).limit(1);

    if (config.length === 0) {
      return NextResponse.json({
        nomeRestaurante: "Lumiere Dining",
        statusLoja: true,
        tempoPreparo: "30-45",
      });
    }

    return NextResponse.json(config[0]);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro interno ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { nomeRestaurante, statusLoja, tempoPreparo } = body;

    const existing = await db.select().from(configuracoes).limit(1);

    if (existing.length === 0) {
      await db.insert(configuracoes).values({
        id: "config-principal",
        nomeRestaurante: String(nomeRestaurante || "Lumiere Dining"),
        statusLoja: Boolean(statusLoja),
        tempoPreparo: String(tempoPreparo || "30-45"),
      });
    } else {
      await db
        .update(configuracoes)
        .set({
          nomeRestaurante: String(nomeRestaurante),
          statusLoja: Boolean(statusLoja),
          tempoPreparo: String(tempoPreparo),
        })
        .where(eq(configuracoes.id, existing[0].id));
    }

    return NextResponse.json({ success: true, message: "Configurações salvas!" });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: "Erro interno ao salvar configurações." }, { status: 500 });
  }
}

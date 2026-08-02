import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { produtos } from "../../../db/schema";
import { isNextResponse, requireAdmin } from "../../../lib/auth";
import { invalidarCacheProdutos } from "../../../lib/produtos-cache";

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    const categoriaAtual = String(body?.categoriaAtual ?? "").trim();
    const novaCategoria = String(body?.novaCategoria ?? "").trim();

    if (!categoriaAtual || !novaCategoria) {
      return NextResponse.json({ error: "Informe o novo nome da categoria." }, { status: 400 });
    }

    await db.update(produtos).set({ categoria: novaCategoria }).where(eq(produtos.categoria, categoriaAtual));
    invalidarCacheProdutos();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a categoria." }, { status: 500 });
  }
}

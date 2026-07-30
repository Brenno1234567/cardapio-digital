import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { usuarios } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isNextResponse } from "../../../../lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    await db.delete(usuarios).where(eq(usuarios.id, id));
    return NextResponse.json({ success: true, message: "Usuário excluído!" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}

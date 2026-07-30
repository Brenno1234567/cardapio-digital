import { NextResponse } from "next/server";
import { db } from "../../../db";
import { pedidos, itensPedido, produtos, configuracoes } from "../../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, isNextResponse, getAuthRole } from "../../../lib/auth";
import { pusherServer } from "../../../lib/pusher-server";

interface ItemPedidoInput {
  id: string;
  quantidade: number;
}

export async function GET(request: Request) {
  try {
    const role = await getAuthRole();
    const idsParam = new URL(request.url).searchParams.get("ids");
    const ids = idsParam
      ?.split(",")
      .map((id) => id.trim())
      .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
      .slice(0, 50) ?? [];

    if (!role && ids.length === 0) {
      return NextResponse.json({ error: "Informe os pedidos que deseja acompanhar." }, { status: 400 });
    }

    const listaPedidos = role
      ? await db.select().from(pedidos)
      : await db.select().from(pedidos).where(inArray(pedidos.id, ids));
    const pedidoIds = listaPedidos.map((pedido) => pedido.id);
    const listaItens = pedidoIds.length > 0
      ? await db.select().from(itensPedido).where(inArray(itensPedido.pedidoId, pedidoIds))
      : [];

    const pedidosComItens = listaPedidos.map((pedido) => ({
      ...pedido,
      itens: listaItens.filter((item) => item.pedidoId === pedido.id),
    }));

    return NextResponse.json(pedidosComItens);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json({ error: "Erro interno ao buscar pedidos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const config = await db.select().from(configuracoes).limit(1);
    if (config.length > 0 && !config[0].statusLoja) {
      return NextResponse.json(
        { error: "A loja está fechada no momento. Tente novamente mais tarde." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const { mesa, cliente, observacao, itens } = body;

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: "O pedido precisa conter pelo menos um item." }, { status: 400 });
    }

    const ids = (itens as ItemPedidoInput[]).map((i) => i.id);

    const produtosDb =
      ids.length > 0
        ? await db.select().from(produtos).where(inArray(produtos.id, ids))
        : [];

    const produtoMap = new Map(produtosDb.map((p) => [p.id, p]));

    let totalCalculado = 0;

    for (const item of itens as ItemPedidoInput[]) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Todos os itens devem referenciar um produto válido." }, { status: 400 });
      }

      if (typeof item.quantidade !== "number" || item.quantidade <= 0 || item.quantidade > 99) {
        return NextResponse.json(
          { error: "Quantidade inválida." },
          { status: 400 }
        );
      }

      const produto = produtoMap.get(item.id);
      if (!produto) {
        return NextResponse.json({ error: "Produto não encontrado." }, { status: 400 });
      }

      if (produto.status !== "Ativo") {
        return NextResponse.json(
          { error: `"${produto.nome}" não está disponível no momento.` },
          { status: 400 }
        );
      }

      totalCalculado += produto.preco * item.quantidade;
    }

    if (totalCalculado <= 0) {
      return NextResponse.json({ error: "O valor total do pedido deve ser maior que zero." }, { status: 400 });
    }

    const mesaFormatada = String(mesa || "Mesa 01").trim().substring(0, 50);
    const clienteFormatado = String(cliente || "Cliente Balcão").trim().substring(0, 100);
    const obsFormatada = String(observacao || "").trim().substring(0, 255);

    const pedidoId = crypto.randomUUID();
    const criadoEm = new Date();

    // 1. Salva no banco de dados primeiro
    await db.transaction(async (tx) => {
      await tx.insert(pedidos).values({
        id: pedidoId,
        mesa: mesaFormatada,
        cliente: clienteFormatado,
        status: "pendente",
        observacao: obsFormatada,
        total: totalCalculado,
        criadoEm,
      });

      const itensParaSalvar = (itens as ItemPedidoInput[]).map((item) => {
        const produto = produtoMap.get(item.id)!;
        return {
          id: crypto.randomUUID(),
          pedidoId,
          produtoNome: produto.nome,
          quantidade: Number(item.quantidade),
          precoUnitario: produto.preco,
        };
      });

      await tx.insert(itensPedido).values(itensParaSalvar);
    });

    // 2. Dispara o sinal do Pusher após salvar no banco
    try {
      await pusherServer?.trigger("canal-restaurante", "novo-pedido", {
        mensagem: "Você tem um novo pedido!",
      });
    } catch (pusherError) {
      console.error("Erro ao enviar sinal via Pusher (Novo Pedido):", pusherError);
    }

    return NextResponse.json(
      { success: true, pedidoId, total: totalCalculado, message: "Pedido criado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no processamento do pedido:", error);
    return NextResponse.json({ error: "Erro interno ao salvar o pedido." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(["admin", "cozinha", "atendente"]);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);

    if (!body?.id || !body?.status) {
      return NextResponse.json({ error: "É necessário fornecer id e status." }, { status: 400 });
    }

    const { id, status } = body;
    const statusValidos = ["pendente", "preparando", "pronto", "entregue", "cancelado"];
    const statusFormatado = String(status).toLowerCase();

    if (!statusValidos.includes(statusFormatado)) {
      return NextResponse.json(
        { error: `Status inválido. Use: ${statusValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const pedidoAtual = await db.select().from(pedidos).where(eq(pedidos.id, String(id))).limit(1);
    if (pedidoAtual.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    if (auth.role === "atendente" && (pedidoAtual[0].status !== "pronto" || statusFormatado !== "entregue")) {
      return NextResponse.json({ error: "Atendente só pode finalizar pedidos prontos." }, { status: 403 });
    }

    // 1. Atualiza no banco de dados
    await db
      .update(pedidos)
      .set({ status: statusFormatado })
      .where(eq(pedidos.id, String(id)));

    // 2. Dispara o sinal do Pusher avisando a atualização de status
    try {
      await pusherServer?.trigger("canal-restaurante", "status-atualizado", {
        id: String(id),
        status: statusFormatado,
      });
    } catch (pusherError) {
      console.error("Erro ao enviar sinal via Pusher (Status Atualizado):", pusherError);
    }

    return NextResponse.json({ success: true, message: "Status atualizado!" });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar status." }, { status: 500 });
  }
}

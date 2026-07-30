"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCartStore } from "../../contexts/cartStore";

function ConteudoCarrinho() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itens, alterarQuantidade, limparCarrinho } = useCartStore();
  const mesaQr = searchParams.get("mesa");
  const mesaValida = Boolean(mesaQr && /^Mesa\s+\d+$/i.test(mesaQr));
  const [retirarNoBalcao, setRetirarNoBalcao] = useState(false);
  const [cliente, setCliente] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const numeroMesa = mesaQr?.match(/^Mesa\s+(\d+)$/i)?.[1];
  const cardapioHref = numeroMesa ? `/cardapio/mesa-${numeroMesa}?ativo=1` : "/cardapio";
  const localPedido = retirarNoBalcao ? "Balcão" : mesaQr!;
  const precoFormatado = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  async function finalizarPedido() {
    if (!mesaValida) return alert("Abra o cardápio pelo QR Code da mesa.");
    if (itens.length === 0) return alert("Seu carrinho está vazio!");
    if (!cliente.trim()) return alert("Por favor, digite o seu nome.");

    setEnviando(true);
    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesa: localPedido,
          cliente,
          observacao,
          itens: itens.map((i) => ({ id: i.id, nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
        }),
      });
      const data = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(data?.error || "Erro ao enviar pedido.");

      const pedidosSalvos = JSON.parse(localStorage.getItem("meusPedidos") || "[]");
      pedidosSalvos.push({ id: data.pedidoId });
      localStorage.setItem("meusPedidos", JSON.stringify(pedidosSalvos));
      alert("Pedido enviado com sucesso para a cozinha!");
      limparCarrinho();
      router.push("/orders");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (!mesaValida) {
    return <main className="min-h-screen bg-fundo flex items-center justify-center p-6 text-center"><div className="max-w-md bg-white border border-cinza-borda rounded-2xl p-8 shadow-sm"><h1 className="text-xl font-extrabold text-verde-escuro mb-3">Abra pelo QR Code da mesa</h1><p className="text-cinza-texto">O carrinho só funciona depois que o cardápio é aberto pelo QR Code.</p></div></main>;
  }

  return (
    <div className="min-h-screen bg-fundo p-4 pb-36 max-w-2xl mx-auto w-full min-w-0">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 min-w-0">
        <button onClick={() => router.push(cardapioHref)} className="bg-white p-2 rounded-xl border border-cinza-borda shadow-sm shrink-0"><ArrowLeft size={20} className="text-verde-escuro" /></button>
        <h1 className="text-lg sm:text-xl font-bold text-verde-escuro truncate">Seu Carrinho</h1>
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-20"><ShoppingCart size={48} className="mx-auto text-cinza-texto mb-3 opacity-40" /><p className="text-cinza-texto font-medium">Seu carrinho está vazio.</p><button onClick={() => router.push(cardapioHref)} className="mt-4 bg-verde-normal text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md">Ver Cardápio</button></div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {itens.map((item) => <div key={item.id} className="bg-white p-4 rounded-2xl border border-cinza-borda/50 shadow-sm flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center min-w-0"><div className="min-w-0 flex-1"><h3 className="font-bold text-verde-escuro truncate">{item.nome}</h3><p className="text-xs text-cinza-texto">Qtd: {item.quantidade}x • {precoFormatado(item.preco)}</p></div><div className="flex items-center justify-between sm:justify-end gap-4 shrink-0"><span className="font-bold text-verde-normal">{precoFormatado(item.preco * item.quantidade)}</span><div className="flex items-center border border-cinza-borda rounded-lg overflow-hidden"><button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} className="p-2 text-verde-escuro hover:bg-verde-claro/40" aria-label="Diminuir"><Minus size={16} /></button><span className="min-w-8 text-center text-sm font-bold text-verde-escuro">{item.quantidade}</span><button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} className="p-2 text-verde-escuro hover:bg-verde-claro/40" aria-label="Aumentar"><Plus size={16} /></button></div></div></div>)}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-cinza-borda/50 shadow-sm space-y-4 mb-6">
            <h3 className="font-bold text-verde-escuro text-sm">Informações do Pedido</h3>
            <div><label className="block text-xs text-cinza-texto mb-1 font-medium">Seu Nome</label><input type="text" placeholder="Ex: Carlos Silva" value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal" /></div>
            <fieldset><legend className="block text-xs text-cinza-texto mb-2 font-medium">Como quer receber?</legend><div className="space-y-2"><label className="flex items-center gap-3 bg-fundo p-3 rounded-xl border border-cinza-borda text-sm cursor-pointer"><input type="radio" name="recebimento" checked={!retirarNoBalcao} onChange={() => setRetirarNoBalcao(false)} /> Entregar na {mesaQr}</label><label className="flex items-center gap-3 bg-fundo p-3 rounded-xl border border-cinza-borda text-sm cursor-pointer"><input type="radio" name="recebimento" checked={retirarNoBalcao} onChange={() => setRetirarNoBalcao(true)} /> Retirar no balcão</label></div></fieldset>
            <div><label className="block text-xs text-cinza-texto mb-1 font-medium">Observações (opcional)</label><input type="text" placeholder="Ex: Sem cebola, molho à parte" value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal" /></div>
          </div>

          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-cinza-borda p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg z-20"><div className="flex justify-between items-center mb-3"><span className="text-cinza-texto text-sm">Total do Pedido:</span><span className="text-xl font-extrabold text-verde-escuro">{precoFormatado(total)}</span></div><button onClick={finalizarPedido} disabled={enviando} className="w-full bg-verde-normal text-white py-3 rounded-xl font-bold shadow-md hover:bg-verde-destaque transition-colors disabled:opacity-50">{enviando ? "Enviando..." : "Finalizar Pedido →"}</button></div>
        </>
      )}
    </div>
  );
}

export default function TelaCarrinho() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-fundo flex items-center justify-center text-verde-escuro">Carregando carrinho...</main>}>
      <ConteudoCarrinho />
    </Suspense>
  );
}

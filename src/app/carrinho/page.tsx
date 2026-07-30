"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCartStore } from "../../contexts/cartStore";

function TelaCarrinho() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itens, removerItem, limparCarrinho } = useCartStore();

  const mesaQr = searchParams.get("mesa")?.trim();
  const [mesa, setMesa] = useState(() => mesaQr ? `Mesa ${mesaQr}` : "Mesa 01");
  const [cliente, setCliente] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Calcula o valor total do carrinho
  const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const precoFormatado = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  // Função que envia o pedido para a API que criamos
async function finalizarPedido() {
    if (itens.length === 0) return alert("Seu carrinho está vazio!");
    if (!cliente.trim()) return alert("Por favor, digite o seu nome.");

    setEnviando(true);

    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesa,
          cliente,
          observacao,
          total,
          itens: itens.map((i) => ({ id: i.id, nome: i.nome, quantidade: i.quantidade })),
        }),
      });

      if (resposta.ok) {
        const data = await resposta.json();
        
        // Salva o ID do pedido no localStorage do cliente para rastreamento
        const pedidosSalvos = JSON.parse(localStorage.getItem("meusPedidos") || "[]");
        pedidosSalvos.push({ id: data.pedidoId });
        localStorage.setItem("meusPedidos", JSON.stringify(pedidosSalvos));

        alert("Pedido enviado com sucesso para a Cozinha! 🎉");
        limparCarrinho();
        router.push("/orders"); // Vai direto para a tela de acompanhamento
      } else {
        alert("Erro ao enviar pedido.");
      }
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo p-4 pb-36 max-w-2xl mx-auto w-full min-w-0">
      {/* Topo */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 min-w-0">
        <button onClick={() => router.push(mesaQr ? `/cardapio?mesa=${encodeURIComponent(mesaQr)}` : "/cardapio")} className="bg-white p-2 rounded-xl border border-cinza-borda shadow-sm shrink-0">
          <ArrowLeft size={20} className="text-verde-escuro" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-verde-escuro truncate">Seu Carrinho</h1>
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={48} className="mx-auto text-cinza-texto mb-3 opacity-40" />
          <p className="text-cinza-texto font-medium">Seu carrinho está vazio.</p>
          <button 
            onClick={() => router.push(mesaQr ? `/cardapio?mesa=${encodeURIComponent(mesaQr)}` : "/cardapio")}
            className="mt-4 bg-verde-normal text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md"
          >
            Ver Cardápio
          </button>
        </div>
      ) : (
        <>
          {/* Lista de Itens */}
          <div className="space-y-3 mb-6">
            {itens.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-cinza-borda/50 shadow-sm flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center min-w-0">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-verde-escuro truncate">{item.nome}</h3>
                  <p className="text-xs text-cinza-texto">Qtd: {item.quantidade}x • {precoFormatado(item.preco)}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="font-bold text-verde-normal">{precoFormatado(item.preco * item.quantidade)}</span>
                  <button onClick={() => removerItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dados do Cliente */}
          <div className="bg-white p-4 rounded-2xl border border-cinza-borda/50 shadow-sm space-y-4 mb-6">
            <h3 className="font-bold text-verde-escuro text-sm">Informações do Pedido</h3>
            
            <div>
              <label className="block text-xs text-cinza-texto mb-1 font-medium">Seu Nome</label>
              <input 
                type="text" 
                placeholder="Ex: Carlos Silva"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal"
              />
            </div>

            <div>
              <label className="block text-xs text-cinza-texto mb-1 font-medium">Mesa / Local</label>
              <select 
                value={mesa} 
                onChange={(e) => setMesa(e.target.value)}
                className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal"
              >
                {mesaQr && !["01", "02", "05", "14"].includes(mesaQr) && (
                  <option value={`Mesa ${mesaQr}`}>Mesa {mesaQr}</option>
                )}
                <option value="Mesa 01">Mesa 01</option>
                <option value="Mesa 02">Mesa 02</option>
                <option value="Mesa 05">Mesa 05</option>
                <option value="Mesa 14">Mesa 14</option>
                <option value="Balcão">Balcão (Takeaway)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-cinza-texto mb-1 font-medium">Observações (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: Sem cebola, molho à parte"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal"
              />
            </div>
          </div>

          {/* Rodapé com Total e Botão */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-cinza-borda p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg z-20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-cinza-texto text-sm">Total do Pedido:</span>
              <span className="text-xl font-extrabold text-verde-escuro">{precoFormatado(total)}</span>
            </div>
            <button 
              onClick={finalizarPedido}
              disabled={enviando}
              className="w-full bg-verde-normal text-white py-3 rounded-xl font-bold shadow-md hover:bg-verde-destaque transition-colors disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Finalizar Pedido →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function CarrinhoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fundo flex items-center justify-center text-verde-escuro">Carregando carrinho...</div>}>
      <TelaCarrinho />
    </Suspense>
  );
}

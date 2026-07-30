"use client";

import { useEffect, useState } from "react";
import { CheckCircle, LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface Pedido {
  id: string;
  mesa: string;
  cliente: string;
  status: string;
  total: number;
  criadoEm: string;
}

export default function AtendimentoPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarPedidos = async () => {
    try {
      const res = await fetch("/api/pedidos");
      if (!res.ok) throw new Error("Erro ao buscar pedidos.");
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data.filter((pedido) => pedido.status === "pronto") : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const primeiraBusca = setTimeout(() => void carregarPedidos(), 0);
    const intervalo = setInterval(carregarPedidos, 5000);
    return () => {
      clearTimeout(primeiraBusca);
      clearInterval(intervalo);
    };
  }, []);

  const finalizarPedido = async (id: string) => {
    const res = await fetch("/api/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "entregue" }),
    });

    if (res.ok) carregarPedidos();
    else alert("Não foi possível finalizar pedido.");
  };

  const sair = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("lumiere_user");
    router.push("/login");
  };

  const moeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  return (
    <main className="min-h-screen bg-fundo p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-verde-escuro">Atendimento</h1>
            <p className="text-sm text-cinza-texto">Pedidos prontos para entrega.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={carregarPedidos} className="p-2.5 rounded-xl bg-white border border-cinza-borda text-verde-escuro" aria-label="Atualizar pedidos">
              <RefreshCw size={20} />
            </button>
            <button onClick={sair} className="p-2.5 rounded-xl bg-verde-escuro text-white" aria-label="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {carregando ? (
          <p className="text-cinza-texto">Carregando pedidos...</p>
        ) : pedidos.length === 0 ? (
          <div className="bg-white border border-cinza-borda rounded-2xl p-8 text-center text-cinza-texto">Nenhum pedido pronto agora.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pedidos.map((pedido) => (
              <article key={pedido.id} className="bg-white border border-cinza-borda rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-bold text-lg text-verde-escuro">{pedido.mesa}</h2>
                    <p className="text-sm text-cinza-texto">{pedido.cliente}</p>
                  </div>
                  <span className="text-sm font-bold text-verde-normal">{moeda(pedido.total)}</span>
                </div>
                <button onClick={() => finalizarPedido(pedido.id)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-verde-normal text-white font-bold">
                  <CheckCircle size={18} /> Entregar pedido
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

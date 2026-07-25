"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Utensils, Users, Settings, LogOut, Pencil, CheckCircle, Clock } from "lucide-react";

interface ItemPedido {
  id: string;
  produtoNome: string;
  quantidade: number;
}

interface Pedido {
  id: string;
  mesa: string;
  cliente: string;
  status: string;
  observacao: string | null;
  total: number;
  criadoEm: string;
  itens: ItemPedido[];
}

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  const horaFormatada = (data: string) =>
    new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const carregarPedidos = async () => {
    try {
      const res = await fetch("/api/pedidos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPedidos(data);
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();

    const intervalo = setInterval(() => {
      carregarPedidos();
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  async function atualizarStatus(id: string, novoStatus: string) {
    try {
      const res = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: novoStatus }),
      });

      if (res.ok) {
        carregarPedidos();
      } else {
        alert("Erro ao atualizar o pedido.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("lumiere_user");
      router.push("/login");
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-fundo">
      <aside className="hidden md:flex w-20 bg-verde-escuro flex-col items-center justify-between py-6 shrink-0">
        <div className="flex flex-col gap-6 text-white/70">
          <Link href="/painel-pedidos" className="bg-verde-normal p-3 rounded-xl text-white shadow-md transition-colors" title="Painel de Pedidos">
            <Utensils size={24} />
          </Link>

          <Link href="/users" className="p-3 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Gerenciar Equipe">
            <Users size={22} />
          </Link>

          <Link href="/settings" className="p-3 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Configurações">
            <Settings size={22} />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/admin" className="text-white/70 hover:text-white p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer" title="Cardápio">
            <Pencil size={22} />
          </Link>
          <button
            onClick={handleLogout}
            className="text-white/70 hover:text-white p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut size={22} />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-verde-escuro">Painel de pedidos</h1>
            <p className="text-xs sm:text-sm text-cinza-texto">Gerenciamento dos pedidos, se o pedido foi concluido e efetuado o pagamento apague!! Aperte em finalizar!!</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-verde-normal border border-cinza-borda">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Ao vivo
            </span>
            <button
              onClick={carregarPedidos}
              className="flex-1 sm:flex-none bg-verde-normal text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-verde-destaque transition-colors cursor-pointer"
            >
              Atualizar Pedidos
            </button>
          </div>
        </div>

        {carregando ? (
          <p className="text-cinza-texto">Carregando pedidos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            <div className="bg-verde-claro/40 p-4 rounded-2xl border border-verde-claro min-w-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-verde-escuro">Novos Pedidos</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-verde-escuro shadow-sm">
                  {pedidos.filter((p) => p.status === "pendente").length}
                </span>
              </div>

              {pedidos.filter((p) => p.status === "pendente").map((pedido) => (
                <div key={pedido.id} className="bg-white p-4 rounded-xl shadow-sm border border-cinza-borda/40 mb-3 min-w-0">
                  <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                    <span className="font-bold text-verde-escuro text-lg truncate">{pedido.mesa}</span>
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <Clock size={12} /> {horaFormatada(pedido.criadoEm)}
                    </span>
                  </div>
                  <p className="text-xs text-cinza-texto mb-3 truncate">{pedido.cliente}</p>

                  <ul className="mb-4 space-y-1">
                    {pedido.itens?.map((item) => (
                      <li key={item.id} className="text-sm font-bold text-verde-escuro flex justify-between gap-2 border-b border-cinza-borda/30 pb-1 min-w-0">
                        <span className="break-words">{item.quantidade}x {item.produtoNome}</span>
                      </li>
                    ))}
                  </ul>

                  {pedido.observacao && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded mb-3 border border-red-100 font-medium">
                      ⚠️Atenção! Obs: {pedido.observacao}
                    </p>
                  )}

                  <button
                    onClick={() => atualizarStatus(pedido.id, "preparando")}
                    className="w-full bg-verde-normal text-white py-2 rounded-lg text-sm font-bold hover:bg-verde-destaque transition-colors cursor-pointer"
                  >
                    Iniciar Preparo →
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-verde-claro/40 p-4 rounded-2xl border border-verde-claro min-w-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-verde-escuro">Em Preparo</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-verde-escuro shadow-sm">
                  {pedidos.filter((p) => p.status === "preparando").length}
                </span>
              </div>

              {pedidos.filter((p) => p.status === "preparando").map((pedido) => (
                <div key={pedido.id} className="bg-white p-4 rounded-xl shadow-sm border-2 border-verde-normal mb-3 min-w-0">
                  <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                    <span className="font-bold text-verde-escuro text-lg truncate">{pedido.mesa}</span>
                    <span className="text-xs text-verde-normal font-medium flex items-center gap-1">
                      <Clock size={12} /> {horaFormatada(pedido.criadoEm)}
                    </span>
                  </div>
                  <p className="text-xs text-cinza-texto mb-3 truncate">{pedido.cliente}</p>

                  <ul className="mb-4 space-y-1 opacity-80">
                    {pedido.itens?.map((item) => (
                      <li key={item.id} className="text-sm font-semibold text-verde-escuro min-w-0">
                        <span className="break-words">{item.quantidade}x {item.produtoNome}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => atualizarStatus(pedido.id, "pronto")}
                    className="w-full bg-verde-claro text-verde-escuro py-2 rounded-lg text-sm font-bold border border-verde-normal hover:bg-verde-normal hover:text-white transition-colors cursor-pointer"
                  >
                    ✓ Marcar como Pronto
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-verde-claro/40 p-4 rounded-2xl border border-verde-claro min-w-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-verde-escuro">Prontos</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-verde-escuro shadow-sm">
                  {pedidos.filter((p) => p.status === "pronto").length}
                </span>
              </div>

              {pedidos.filter((p) => p.status === "pronto").map((pedido) => (
                <div key={pedido.id} className="bg-white p-4 rounded-xl shadow-sm border border-cinza-borda/40 mb-3 opacity-90 min-w-0">
                  <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                    <span className="font-bold text-verde-escuro text-lg truncate">{pedido.mesa}</span>
                    <span className="text-xs text-green-600 font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle size={12} /> Pronto
                    </span>
                  </div>
                  <p className="text-xs text-cinza-texto mb-3 truncate">{pedido.cliente}</p>

                  <button
                    onClick={() => atualizarStatus(pedido.id, "entregue")}
                    className="text-xs text-verde-normal font-bold cursor-pointer hover:underline w-full text-left"
                  >
                    Finalizar (Entregue)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-verde-escuro border-t border-white/10 flex justify-around items-center p-2 safe-bottom z-30">
        <Link href="/painel-pedidos" className="flex flex-col items-center gap-0.5 p-2 text-white">
          <Utensils size={20} />
          <span className="text-[10px] font-medium">Pedidos</span>
        </Link>
        <Link href="/users" className="flex flex-col items-center gap-0.5 p-2 text-white/70">
          <Users size={20} />
          <span className="text-[10px] font-medium">Equipe</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5 p-2 text-white/70">
          <Settings size={20} />
          <span className="text-[10px] font-medium">Config</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-0.5 p-2 text-white/70">
          <Pencil size={20} />
          <span className="text-[10px] font-medium">Cardápio</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 p-2 text-white/70">
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </nav>
    </div>
  );
}

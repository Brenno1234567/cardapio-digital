"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Store, Clock, ArrowLeft, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [statusLoja, setStatusLoja] = useState(true);
  const [tempoPreparo, setTempoPreparo] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Carrega as configurações do Banco de Dados ao abrir a página
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data) {
          setNomeRestaurante(data.nomeRestaurante || "Lumiere Dining");
          setStatusLoja(data.statusLoja ?? true);
          setTempoPreparo(data.tempoPreparo || "30-45");
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregarConfiguracoes();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeRestaurante,
          statusLoja,
          tempoPreparo,
        }),
      });

      if (res.ok) {
        setSalvo(true);
        setTimeout(() => setSalvo(false), 3000);
      } else {
        alert("Erro ao salvar configurações.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão com o servidor.");
    }
  };

  if (carregando) {
    return <div className="min-h-screen bg-fundo flex items-center justify-center text-verde-escuro font-bold">Carregando configurações...</div>;
  }

  return (
    <div className="min-h-screen bg-fundo flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-verde-escuro text-white p-4 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/painel-pedidos" className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base sm:text-xl font-bold flex items-center gap-2 min-w-0">
            <Settings size={20} className="shrink-0" />
            <span className="truncate">Configurações do Sistema</span>
          </h1>
        </div>
        <span className="text-xs bg-verde-normal px-3 py-1 rounded-full font-medium self-start sm:self-auto">Painel Admin</span>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <form onSubmit={handleSalvar} className="space-y-6">
          
          {/* Card: Informações do Estabelecimento */}
          <div className="bg-white p-6 rounded-2xl border border-cinza-borda shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cinza-borda/40">
              <div className="p-2.5 bg-verde-normal/10 text-verde-normal rounded-xl">
                <Store size={20} />
              </div>
              <div>
                <h2 className="font-bold text-verde-escuro text-lg">Estabelecimento</h2>
                <p className="text-xs text-cinza-texto">Informações públicas armazenadas no banco de dados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1">Nome do Restaurante</label>
                <input 
                  type="text" 
                  value={nomeRestaurante}
                  onChange={(e) => setNomeRestaurante(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1">Status Operacional</label>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStatusLoja(!statusLoja)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${statusLoja ? "bg-verde-normal" : "bg-red-400"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${statusLoja ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className={`text-xs sm:text-sm font-bold ${statusLoja ? "text-green-600" : "text-red-500"}`}>
                    {statusLoja ? "Loja Aberta (Aceitando Pedidos)" : "Loja Fechada"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Operações e Cozinha */}
          <div className="bg-white p-6 rounded-2xl border border-cinza-borda shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cinza-borda/40">
              <div className="p-2.5 bg-verde-normal/10 text-verde-normal rounded-xl">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="font-bold text-verde-escuro text-lg">Prazos e Cozinha</h2>
                <p className="text-xs text-cinza-texto">Tempo estimado de atendimento</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-verde-escuro mb-1">Tempo Médio de Preparo (Minutos)</label>
              <input 
                type="text" 
                value={tempoPreparo}
                onChange={(e) => setTempoPreparo(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                required
              />
            </div>
          </div>

          {/* Botão de Salvar */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
            {salvo && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200 text-center">
                Configurações salvas no banco com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-verde-normal hover:bg-verde-destaque text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer w-full sm:w-auto"
            >
              <Save size={18} /> Salvar Alterações
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
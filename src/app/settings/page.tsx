"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Save, Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const [statusLoja, setStatusLoja] = useState(true);
  const [tempoPreparo, setTempoPreparo] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setStatusLoja(data.statusLoja ?? true);
        setTempoPreparo(data.tempoPreparo || "30-45");
      })
      .catch(() => alert("Não foi possível carregar as configurações."))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusLoja, tempoPreparo }),
    });
    if (!res.ok) return alert("Erro ao salvar configurações.");
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  }

  if (carregando) return <main className="min-h-screen bg-fundo flex items-center justify-center text-verde-escuro font-bold">Carregando configurações...</main>;

  return (
    <div className="min-h-screen bg-fundo flex flex-col">
      <header className="bg-verde-escuro text-white p-4 md:px-8 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3"><Link href="/painel-pedidos" className="p-2 bg-white/10 rounded-xl"><ArrowLeft size={20} /></Link><h1 className="text-base sm:text-xl font-bold flex items-center gap-2"><Settings size={20} /> Configurações</h1></div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <form onSubmit={salvar} className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-cinza-borda shadow-sm">
            <h2 className="font-bold text-verde-escuro text-lg mb-2">Operação do estabelecimento</h2>
            <p className="text-xs text-cinza-texto mb-5">Controle a disponibilidade para novos pedidos.</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setStatusLoja(!statusLoja)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${statusLoja ? "bg-verde-normal" : "bg-red-400"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${statusLoja ? "translate-x-6" : "translate-x-1"}`} /></button>
              <span className={`text-sm font-bold ${statusLoja ? "text-verde-destaque" : "text-red-500"}`}>{statusLoja ? "Loja aberta (aceitando pedidos)" : "Loja fechada"}</span>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-cinza-borda shadow-sm">
            <div className="flex items-center gap-3 mb-4"><div className="p-2.5 bg-verde-normal/10 text-verde-normal rounded-xl"><Clock size={20} /></div><div><h2 className="font-bold text-verde-escuro text-lg">Prazos e cozinha</h2><p className="text-xs text-cinza-texto">Tempo estimado de atendimento</p></div></div>
            <label className="block text-xs font-semibold text-verde-escuro mb-1">Tempo médio de preparo (minutos)</label>
            <input type="text" value={tempoPreparo} onChange={(event) => setTempoPreparo(event.target.value)} className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium" required />
          </section>

          <div className="flex items-center justify-end gap-4">{salvo && <span className="text-xs font-bold text-verde-destaque">Configurações salvas.</span>}<button type="submit" className="flex items-center gap-2 bg-verde-normal hover:bg-verde-destaque text-white font-bold px-6 py-3 rounded-xl shadow-md"><Save size={18} /> Salvar alterações</button></div>
        </form>
      </main>
    </div>
  );
}

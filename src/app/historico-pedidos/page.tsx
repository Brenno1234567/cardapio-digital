"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, RefreshCw, Trash2 } from "lucide-react";

type Item = { id: string; produtoNome: string; quantidade: number; precoUnitario: number };
type Pedido = { id: string; mesa: string; cliente: string; status: string; observacao: string | null; total: number; criadoEm: string; itens: Item[] };

export default function HistoricoPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const carregar = async () => { setCarregando(true); try { const r = await fetch("/api/pedidos"); const d = await r.json(); if (Array.isArray(d)) setPedidos(d.sort((a: Pedido, b: Pedido) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())); } finally { setCarregando(false); } };
  useEffect(() => { carregar(); }, []);
  const excluir = async (id: string) => { if (!confirm("Excluir este pedido e todos os itens dele?")) return; const r = await fetch("/api/pedidos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (r.ok) setPedidos((p) => p.filter((x) => x.id !== id)); else alert("Nao foi possivel excluir."); };
  const lista = filtro === "todos" ? pedidos : pedidos.filter((p) => p.status === filtro);
  const moeda = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  return <main className="min-h-screen bg-fundo p-4 sm:p-8"><div className="max-w-6xl mx-auto">
    <header className="flex flex-wrap justify-between items-center gap-4 mb-7"><div className="flex gap-3 items-center"><Link href="/painel-pedidos" className="p-2 bg-white border border-cinza-borda rounded-xl text-verde-escuro"><ArrowLeft /></Link><div><h1 className="flex gap-2 items-center text-2xl font-bold text-verde-escuro"><History /> Historico de pedidos</h1><p className="text-sm text-cinza-texto">Todos os pedidos feitos.</p></div></div><button onClick={carregar} className="flex gap-2 items-center px-4 py-2 bg-verde-normal text-white rounded-xl font-bold"><RefreshCw size={17} /> Atualizar</button></header>
    <div className="flex gap-2 overflow-x-auto pb-4">{["todos","pendente","preparando","pronto","entregue","cancelado"].map((s) => <button key={s} onClick={() => setFiltro(s)} className={`px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap ${filtro === s ? "bg-verde-normal text-white" : "bg-white border border-cinza-borda text-verde-escuro"}`}>{s === "todos" ? "Todos" : s}</button>)}</div>
    {carregando ? <p>Carregando...</p> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{lista.map((p) => <article key={p.id} className="bg-white border border-cinza-borda rounded-2xl p-5 shadow-sm"><div className="flex justify-between border-b border-cinza-borda pb-3"><div><h2 className="font-bold text-lg text-verde-escuro">{p.mesa}</h2><p className="text-sm text-cinza-texto">{p.cliente}</p></div><b className="text-sm text-verde-normal">{p.status}</b></div><p className="text-xs text-cinza-texto my-3">{new Date(p.criadoEm).toLocaleString("pt-BR")}</p><ul className="space-y-2 mb-4">{p.itens.map((i) => <li key={i.id} className="flex justify-between text-sm"><span>{i.quantidade}x {i.produtoNome}</span><span>{moeda(i.quantidade * i.precoUnitario)}</span></li>)}</ul>{p.observacao && <p className="bg-amber-50 p-3 rounded-lg text-sm mb-4"><b>Observacao:</b> {p.observacao}</p>}<div className="flex justify-between border-t border-cinza-borda pt-3"><b>Total: {moeda(p.total)}</b><button onClick={() => excluir(p.id)} className="flex gap-2 items-center text-red-600 font-bold"><Trash2 size={16} /> Excluir</button></div></article>)}</div>}
  </div></main>;
}


"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingCart, Receipt, Home, X, Store } from "lucide-react";
import CardProduto from "./CardProduto";
import ModalProduto, { type ProdutoDetalhe } from "./ModalProduto";
import { useCartStore } from "../contexts/cartStore";
import type { TipoVariacao } from "../contexts/cartStore";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  tipoVariacao?: TipoVariacao;
  opcoesVariacao?: string | null;
}

interface Configuracoes {
  statusLoja: boolean;
  tempoPreparo: string;
}

export function CardapioCliente({ mesa }: { mesa?: string }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [isBouncing, setIsBouncing] = useState(false);
  const [isPesquisando, setIsPesquisando] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoDetalhe | null>(null);

  const itensCarrinho = useCartStore((state) => state.itens);
  const definirMesa = useCartStore((state) => state.definirMesa);
  const quantidadeTotal = itensCarrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const mesaParam = mesa;
  const mesaValida = Boolean(mesaParam && /^Mesa\s+\d+$/i.test(mesaParam));

  useEffect(() => {
    if (mesaValida) definirMesa(mesaParam!);
  }, [definirMesa, mesaParam, mesaValida]);

  useEffect(() => {
    if (quantidadeTotal > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [quantidadeTotal]);

  useEffect(() => {
    Promise.all([fetch("/api/produtos"), fetch("/api/settings")])
      .then(async ([resProdutos, resConfig]) => {
        const dataProdutos = await resProdutos.json();
        const dataConfig = await resConfig.json();
        setProdutos(Array.isArray(dataProdutos) ? dataProdutos : []);
        setConfig(dataConfig);
      })
      .catch((err) => {
        console.error("Erro ao carregar cardápio:", err);
        setProdutos([]);
      })
      .finally(() => setCarregando(false));
  }, []);

  const alternarPesquisa = () => {
    setIsPesquisando(!isPesquisando);
    if (isPesquisando) setTermoPesquisa("");
  };

  const normalizarTexto = (texto: string | null | undefined) =>
    (texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const categorias = [
    "Todos",
    ...Array.from(new Set(produtos.map((produto) => produto.categoria?.trim()).filter(Boolean))).sort(),
  ];

  const produtosFiltrados = produtos.filter((p) => {
    if (isPesquisando && termoPesquisa.trim() !== "") {
      const termo = normalizarTexto(termoPesquisa);
      return (
        normalizarTexto(p.nome).includes(termo) ||
        normalizarTexto(p.descricao).includes(termo) ||
        normalizarTexto(p.categoria || "").includes(termo)
      );
    }
    if (categoriaAtiva === "Todos") return true;
    return p.categoria?.trim().toLowerCase() === categoriaAtiva.toLowerCase();
  });

  const getIcone = (cat: string) => {
    switch (cat) {
      case "Lanches": return "🍔";
      case "Bebidas": return "🍸";
      case "Acompanhamentos": return "🍟";
      case "Sobremesas": return "🍰";
      default: return "🍽️";
    }
  };

  const lojaAberta = config?.statusLoja ?? true;
  const numeroMesa = mesaParam?.match(/^Mesa\s+(\d+)$/i)?.[1];
  const cardapioHref = numeroMesa ? `/cardapio/mesa-${numeroMesa}?ativo=1` : "/cardapio";
  const carrinhoHref = mesaParam
    ? `/carrinho?mesa=${encodeURIComponent(mesaParam)}`
    : "/carrinho";

  if (!mesaValida) {
    return (
      <main className="min-h-screen bg-fundo flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-cinza-borda rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-verde-escuro mb-3">Acesse pelo QR Code da mesa</h1>
          <p className="text-cinza-texto">Escaneie o QR Code disponível na sua mesa para abrir o cardápio e fazer seu pedido.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-fundo flex flex-col relative pb-24 md:pb-0">
      <header className="flex flex-col p-4 md:px-8 sticky top-0 bg-fundo/95 backdrop-blur-sm z-30 border-b border-cinza-borda/40 gap-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="relative shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hidden md:flex p-2.5 bg-verde-normal text-white rounded-xl shadow-md hover:bg-verde-destaque transition-all items-center justify-center"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 mt-3 w-64 bg-verde-escuro text-white rounded-2xl shadow-2xl p-4 z-50 border border-verde-normal/40">
                <nav className="flex flex-col gap-1.5">
                  <Link href={cardapioHref} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                    <Home size={18} /> Cardápio
                  </Link>
                  <button onClick={() => { setIsMenuOpen(false); alternarPesquisa(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium w-full text-left">
                    <Search size={18} /> Pesquisar
                  </button>
                  <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                    <Receipt size={18} /> Meus Pedidos
                  </Link>
                  <Link href={carrinhoHref} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                    <ShoppingCart size={18} /> Carrinho
                  </Link>
                </nav>
              </div>
            )}
          </div>

          <img
            src="/logo-erva-doce-transparent.png"
            alt="Erva Doce AscanI Panificadora"
            className="h-12 w-16 object-contain shrink-0"
          />

          <div className="flex-1" aria-hidden="true" />

          <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={alternarPesquisa}
              className={`p-2.5 border rounded-xl transition-colors shadow-sm ${isPesquisando ? "bg-verde-escuro text-white border-verde-escuro" : "bg-white border-cinza-borda text-verde-escuro hover:bg-gray-50"}`}
              aria-label="Pesquisar"
            >
              {isPesquisando ? <X size={20} /> : <Search size={20} />}
            </button>

            <Link href={carrinhoHref} className="relative p-2.5 bg-verde-normal text-white rounded-xl shadow-md hover:bg-verde-destaque transition-colors flex items-center justify-center">
              <ShoppingCart size={20} />
              {quantidadeTotal > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white shadow ${isBouncing ? "animate-bounce" : ""}`}>
                  {quantidadeTotal}
                </span>
              )}
            </Link>
          </div>
        </div>

        {isPesquisando && (
          <input
            type="text"
            autoFocus
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            placeholder="Busque por nome, ingrediente ou categoria..."
            className="w-full bg-white border-2 border-verde-normal/50 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:border-verde-normal shadow-sm text-verde-escuro placeholder-cinza-texto"
          />
        )}
      </header>

      {!lojaAberta && (
        <div className="mx-4 md:mx-12 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <Store size={18} />
          Estamos fechados no momento. Você pode ver o cardápio, mas novos pedidos estão indisponíveis.
        </div>
      )}

      <main className="flex-1 px-4 md:px-12 py-6 max-w-7xl mx-auto w-full">
        {!isPesquisando && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 mb-6">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-all duration-300 shadow-sm ${
                  categoriaAtiva === cat
                    ? "bg-verde-normal text-white shadow-md scale-105"
                    : "border border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal"
                }`}
              >
                <span>{getIcone(cat)}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-verde-escuro">
            {isPesquisando && termoPesquisa
              ? `Resultados para "${termoPesquisa}"`
              : categoriaAtiva === "Todos" ? "Todo o Cardápio" : `Destaques em ${categoriaAtiva}`}
          </h2>
          <p className="text-xs md:text-sm text-cinza-texto">
            Mostrando {produtosFiltrados.length} {produtosFiltrados.length === 1 ? "opção" : "opções"}
            {config?.tempoPreparo && ` • Preparo: ${config.tempoPreparo} min`}
          </p>
        </div>

        {carregando ? (
          <p className="text-center text-cinza-texto py-16">Carregando cardápio...</p>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cinza-borda/50 p-8 shadow-sm">
            <p className="text-lg font-semibold text-verde-escuro mb-1">Nada encontrado</p>
            <p className="text-sm text-cinza-texto">
              {isPesquisando ? "Tente buscar por outro nome ou ingrediente." : `Não há produtos em "${categoriaAtiva}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 min-w-0">
            {produtosFiltrados.map((produto) => (
              <CardProduto
                key={produto.id}
                id={produto.id}
                nome={produto.nome}
                descricao={produto.descricao}
                preco={produto.preco}
                imagem={produto.imagem}
                tipoVariacao={produto.tipoVariacao ?? null}
                opcoesVariacao={produto.opcoesVariacao}
                onClick={() =>
                  setProdutoSelecionado({
                    id: produto.id,
                    nome: produto.nome,
                    descricao: produto.descricao,
                    preco: produto.preco,
                    imagem: produto.imagem,
                    tipoVariacao: produto.tipoVariacao ?? null,
                    opcoesVariacao: produto.opcoesVariacao,
                  })
                }
              />
            ))}
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-cinza-borda/60 flex justify-around items-center p-3 safe-bottom z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <Link href={cardapioHref} className="flex flex-col items-center text-verde-normal">
          <div className="bg-verde-normal text-white p-2 rounded-full mb-1 shadow">
            <Home size={18} />
          </div>
          <span className="text-[10px] font-bold">Menu</span>
        </Link>
        <button onClick={alternarPesquisa} className={`flex flex-col items-center transition-colors ${isPesquisando ? "text-verde-normal" : "text-cinza-texto hover:text-verde-normal"}`}>
          <Search size={20} className="mb-1" />
          <span className="text-[10px] font-medium">Buscar</span>
        </button>
        <Link href="/orders" className="flex flex-col items-center text-cinza-texto hover:text-verde-normal transition-colors">
          <Receipt size={20} className="mb-1" />
          <span className="text-[10px] font-medium">Pedidos</span>
        </Link>
        <Link href={carrinhoHref} className="flex flex-col items-center text-cinza-texto hover:text-verde-normal transition-colors relative">
          <div className="relative">
            <ShoppingCart size={20} className="mb-1" />
            {quantidadeTotal > 0 && (
              <span className={`absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${isBouncing ? "animate-bounce" : ""}`}>
                {quantidadeTotal}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Carrinho</span>
        </Link>
      </nav>

      {/* Modal de detalhes do produto */}
      {produtoSelecionado && (
        <ModalProduto
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
        />
      )}
    </div>
  );
}

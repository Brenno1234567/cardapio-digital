"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCartStore, parseOpcoesVariacao, type TipoVariacao } from "../contexts/cartStore";

export interface ProdutoDetalhe {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  tipoVariacao?: TipoVariacao;
  opcoesVariacao?: string | null;
}

interface ModalProdutoProps {
  produto: ProdutoDetalhe;
  onClose: () => void;
}

const IMAGEM_PADRAO = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";

const precoFormatado = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ModalProduto({ produto, onClose }: ModalProdutoProps) {
  const adicionarItem = useCartStore((state) => state.adicionarItem);

  const opcoes = useMemo(
    () => parseOpcoesVariacao(produto.opcoesVariacao),
    [produto.opcoesVariacao]
  );

  const temVariacao = Boolean(produto.tipoVariacao) && opcoes.length > 0;

  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [erroVariacao, setErroVariacao] = useState(false);

  // Reset quando o produto muda
  useEffect(() => {
    setOpcaoSelecionada(null);
    setQuantidade(1);
    setErroVariacao(false);
  }, [produto.id]);

  // Bloqueia scroll do body enquanto aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Preço ativo: se tem variação e selecionou, usa o preço da opção;
  // senão usa o preço base do produto
  const precoAtivo = temVariacao && opcaoSelecionada
    ? opcoes.find((o) => o.opcao === opcaoSelecionada)?.preco ?? produto.preco
    : produto.preco;

  const precoTotal = precoAtivo * quantidade;

  function handleAdicionar() {
    if (temVariacao && !opcaoSelecionada) {
      setErroVariacao(true);
      return;
    }

    adicionarItem({
      id: produto.id,
      nome: produto.nome,
      preco: precoAtivo,
      variacao: opcaoSelecionada,
      tipoVariacao: produto.tipoVariacao ?? null,
    });

    // Se quantidade > 1, adiciona o restante
    for (let i = 1; i < quantidade; i++) {
      adicionarItem({
        id: produto.id,
        nome: produto.nome,
        preco: precoAtivo,
        variacao: opcaoSelecionada,
        tipoVariacao: produto.tipoVariacao ?? null,
      });
    }

    onClose();
  }

  const labelVariacao =
    produto.tipoVariacao === "tamanho"
      ? "Tamanho"
      : produto.tipoVariacao === "peso"
      ? "Peso"
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X size={18} className="text-verde-escuro" />
        </button>

        {/* Imagem em destaque */}
        <div className="w-full h-56 sm:h-64 bg-gray-200 overflow-hidden rounded-t-3xl">
          <img
            src={produto.imagem || IMAGEM_PADRAO}
            alt={produto.nome}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-5">
          {/* Título e preço */}
          <div>
            <h2 className="text-xl font-extrabold text-verde-escuro leading-tight pr-8">
              {produto.nome}
            </h2>
            {temVariacao ? (
              <p className="text-sm text-cinza-texto mt-1">
                a partir de{" "}
                <span className="font-extrabold text-verde-normal text-lg">
                  {precoFormatado.format(Math.min(...opcoes.map((o) => o.preco)))}
                </span>
              </p>
            ) : (
              <p className="text-2xl font-extrabold text-verde-normal mt-2">
                {precoFormatado.format(produto.preco)}
              </p>
            )}
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div>
              <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-1">
                Descrição
              </h3>
              <p className="text-sm text-verde-escuro/80 leading-relaxed">
                {produto.descricao}
              </p>
            </div>
          )}

          {/* Seletor de variação com preços por opção */}
          {temVariacao && labelVariacao && (
            <div>
              <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-2">
                Escolha o {labelVariacao?.toLowerCase()}
                {erroVariacao && (
                  <span className="ml-2 text-red-500 normal-case tracking-normal font-semibold">
                    Selecione uma opção
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {opcoes.map((opcao) => {
                  const selecionada = opcaoSelecionada === opcao.opcao;
                  return (
                    <button
                      key={opcao.opcao}
                      type="button"
                      onClick={() => {
                        setOpcaoSelecionada(opcao.opcao);
                        setErroVariacao(false);
                      }}
                      className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        selecionada
                          ? "border-verde-normal bg-verde-normal text-white shadow-md"
                          : erroVariacao
                          ? "border-red-300 bg-red-50 text-red-500 hover:border-red-400"
                          : "border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal"
                      }`}
                    >
                      <span className="truncate">{opcao.opcao}</span>
                      <span className={selecionada ? "text-white" : "text-verde-normal"}>
                        {precoFormatado.format(opcao.preco)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contador de quantidade */}
          <div>
            <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-2">
              Quantidade
            </h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                disabled={quantidade <= 1}
                className="p-2 rounded-xl border border-cinza-borda hover:bg-gray-50 disabled:opacity-30 transition-colors"
                aria-label="Diminuir"
              >
                <Minus size={18} className="text-verde-escuro" />
              </button>
              <span className="text-xl font-extrabold text-verde-escuro w-8 text-center">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={() => setQuantidade(Math.min(99, quantidade + 1))}
                className="p-2 rounded-xl border border-cinza-borda hover:bg-gray-50 transition-colors"
                aria-label="Aumentar"
              >
                <Plus size={18} className="text-verde-escuro" />
              </button>
            </div>
          </div>

          {/* Resumo e botão principal */}
          <div className="border-t border-cinza-borda/50 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-cinza-texto font-medium">Total</span>
              <span className="text-xl font-extrabold text-verde-escuro">
                {precoFormatado.format(precoTotal)}
              </span>
            </div>

            {opcaoSelecionada && (
              <p className="text-xs text-cinza-texto">
                {labelVariacao}:{" "}
                <span className="font-bold text-verde-escuro">
                  {opcaoSelecionada}
                </span>
                {" — "}
                <span className="font-bold text-verde-normal">
                  {precoFormatado.format(precoAtivo)}
                </span>
                {" / un."}
              </p>
            )}

            <button
              type="button"
              onClick={handleAdicionar}
              className="w-full bg-verde-normal hover:bg-verde-destaque text-white font-bold py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingCart size={18} />
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

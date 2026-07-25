"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, X, Utensils, ArrowLeft, Image as ImageIcon } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
}

export default function PainelAdmin() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados do Formulário e Edição
  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Lanches");
  const [imagem, setImagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  const precoFormatado = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const carregarProdutos = async () => {
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProdutos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Preenche o formulário para edição
  const iniciarEdicao = (produto: Produto) => {
    setProdutoEditandoId(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setPreco(produto.preco.toString());
    setCategoria(produto.categoria || "Lanches");
    setImagem(produto.imagem || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Limpa o formulário e cancela o modo de edição
  const cancelarEdicao = () => {
    setProdutoEditandoId(null);
    setNome("");
    setDescricao("");
    setPreco("");
    setCategoria("Lanches");
    setImagem("");
  };

  // Salvar (Cadastra novo ou Atualiza existente)
  async function salvarProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !preco) {
      return alert("Preencha o nome e o preço do produto!");
    }

    setSalvando(true);
    try {
      const url = produtoEditandoId ? `/api/produtos/${produtoEditandoId}` : "/api/produtos";
      const method = produtoEditandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao,
          preco: Number(preco),
          categoria,
          imagem: imagem.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        }),
      });

      if (res.ok) {
        alert(produtoEditandoId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
        cancelarEdicao();
        carregarProdutos();
      } else {
        alert("Erro ao salvar produto.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProduto(id: string) {
    if (!confirm("Tem certeza que deseja remover este item do cardápio?")) return;

    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (produtoEditandoId === id) {
          cancelarEdicao();
        }
        carregarProdutos();
      } else {
        alert("Erro ao excluir produto.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    }
  }

  return (
    <div className="min-h-screen bg-fundo p-4 sm:p-6 md:p-10">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={() => router.push("/painel-pedidos")} className="bg-white p-2 rounded-xl border border-cinza-borda shadow-sm hover:bg-gray-50 shrink-0">
            <ArrowLeft size={20} className="text-verde-escuro" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-verde-escuro truncate">Painel Administrativo</h1>
            <p className="text-xs sm:text-sm text-cinza-texto">Gerencie os itens do seu cardápio em tempo real</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
        {/* Formulário para Cadastro / Edição */}
        <div className="bg-white p-6 rounded-2xl border border-cinza-borda/60 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-verde-escuro flex items-center gap-2">
              {produtoEditandoId ? (
                <>
                  <Edit3 size={20} className="text-amber-500" /> Editar Item
                </>
              ) : (
                <>
                  <Plus size={20} className="text-verde-normal" /> Adicionar Novo Item
                </>
              )}
            </h2>
            {produtoEditandoId && (
              <button
                onClick={cancelarEdicao}
                className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={salvarProduto} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1">Nome do Produto</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Burger Artesanal"
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal"
              >
                <option value="Lanches">Lanches</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Acompanhamentos">Acompanhamentos</option>
                <option value="Sobremesas">Sobremesas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: 29.90"
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1">URL da Imagem</label>
              <input
                type="url"
                value={imagem}
                onChange={(e) => setImagem(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ingredientes e detalhes..."
                rows={3}
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className={`w-full text-white py-3 rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50 ${
                produtoEditandoId ? "bg-amber-500 hover:bg-amber-600" : "bg-verde-normal hover:bg-verde-destaque"
              }`}
            >
              {salvando ? "Salvando..." : produtoEditandoId ? "Salvar Alterações" : "Cadastrar Produto"}
            </button>
          </form>
        </div>

        {/* Lista de Produtos Cadastrados */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-cinza-borda/60 shadow-sm">
          <h2 className="text-lg font-bold text-verde-escuro mb-4 flex items-center gap-2">
            <Utensils size={20} className="text-verde-normal" /> Itens no Cardápio ({produtos.length})
          </h2>

          {carregando ? (
            <p className="text-cinza-texto text-sm py-10 text-center">Carregando cardápio...</p>
          ) : produtos.length === 0 ? (
            <p className="text-cinza-texto text-sm py-10 text-center">Nenhum produto cadastrado ainda.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] lg:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border border-cinza-borda/40 bg-fundo/40 hover:bg-fundo transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {produto.imagem ? (
                        <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-verde-normal bg-verde-claro/50 px-2 py-0.5 rounded">
                        {produto.categoria}
                      </span>
                      <h3 className="font-bold text-verde-escuro text-sm sm:text-base mt-1 truncate">{produto.nome}</h3>
                      <p className="text-xs text-cinza-texto line-clamp-2 sm:line-clamp-1">{produto.descricao}</p>
                      <span className="text-sm font-extrabold text-verde-escuro mt-1 block">
                        {precoFormatado(produto.preco)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => iniciarEdicao(produto)}
                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl border border-amber-200 transition-colors"
                      title="Editar produto"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => excluirProduto(produto.id)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
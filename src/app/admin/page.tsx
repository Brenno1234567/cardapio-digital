"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, X, Utensils, ArrowLeft, Image as ImageIcon, Ruler, Weight } from "lucide-react";
import { parseOpcoesVariacao, serializarOpcoesVariacao, type OpcaoVariacao } from "../../contexts/cartStore";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  tipoVariacao?: "tamanho" | "peso" | null;
  opcoesVariacao?: string | null;
}

export default function PainelAdmin() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Lanches");
  const [imagem, setImagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const [tipoVariacao, setTipoVariacao] = useState<"" | "tamanho" | "peso">("");
  const [opcoesVariacao, setOpcoesVariacao] = useState<OpcaoVariacao[]>([]);

  const precoFormatado = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const categoriasDisponiveis = Array.from(
    new Set(produtos.map((produto) => produto.categoria?.trim()).filter(Boolean))
  ).sort();

  const carregarProdutos = async () => {
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();
      if (Array.isArray(data)) setProdutos(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const iniciarEdicao = (produto: Produto) => {
    setProdutoEditandoId(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setPreco(produto.preco.toString());
    setCategoria(produto.categoria || "Lanches");
    setImagem(produto.imagem || "");
    setTipoVariacao((produto.tipoVariacao as "tamanho" | "peso") || "");
    setOpcoesVariacao(parseOpcoesVariacao(produto.opcoesVariacao));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicao = () => {
    setProdutoEditandoId(null);
    setNome("");
    setDescricao("");
    setPreco("");
    setCategoria("Lanches");
    setImagem("");
    setTipoVariacao("");
    setOpcoesVariacao([]);
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFazendoUpload(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setImagem(data.url);
      else alert("Erro ao fazer upload da imagem.");
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro de conexão ao enviar imagem.");
    } finally {
      setFazendoUpload(false);
    }
  };

  async function salvarProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !preco) return alert("Preencha o nome e o preço do produto!");
    if (fazendoUpload) return alert("Aguarde o envio da imagem terminar!");
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
          tipoVariacao: tipoVariacao || null,
          opcoesVariacao: tipoVariacao ? serializarOpcoesVariacao(opcoesVariacao) : null,
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
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (produtoEditandoId === id) cancelarEdicao();
        carregarProdutos();
      } else {
        alert("Erro ao excluir produto.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    }
  }

  async function editarCategoria(categoriaAtual: string) {
    const novaCategoria = window.prompt("Novo nome da categoria:", categoriaAtual)?.trim();
    if (!novaCategoria || novaCategoria === categoriaAtual) return;
    const res = await fetch("/api/categorias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoriaAtual, novaCategoria }),
    });
    if (!res.ok) return alert("Não foi possível editar a categoria.");
    if (categoria === categoriaAtual) setCategoria(novaCategoria);
    carregarProdutos();
  }

  return (
    <div className="min-h-screen bg-fundo p-4 sm:p-6 md:p-10">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => router.push("/painel-pedidos")}
            className="bg-white p-2.5 rounded-xl border border-cinza-borda shadow-sm hover:border-dourado/60 hover:bg-dourado-claro/30 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={20} className="text-verde-escuro" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-dourado-escuro mb-0.5">
              Lumière • Gestão
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-verde-escuro truncate">Cardápio</h1>
            <p className="text-xs sm:text-sm text-cinza-texto">Gerencie os itens do seu cardápio em tempo real.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
        {/* ─── Formulário ─── */}
        <div className="bg-white p-6 rounded-2xl border border-cinza-borda/60 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-dourado/30">
            <h2 className="text-lg font-bold text-verde-escuro flex items-center gap-2">
              {produtoEditandoId ? (
                <>
                  <Edit3 size={19} className="text-amber-500" /> Editar item
                </>
              ) : (
                <>
                  <Plus size={19} className="text-verde-normal" /> Adicionar novo item
                </>
              )}
            </h2>
            {produtoEditandoId && (
              <button
                onClick={cancelarEdicao}
                className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={salvarProduto} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1.5">Nome do produto</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Burger Artesanal"
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1.5">Categoria</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                list="categorias-disponiveis"
                placeholder="Digite ou escolha uma categoria"
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15 transition-all"
              />
              <datalist id="categorias-disponiveis">
                {categoriasDisponiveis.map((categoriaDisponivel) => (
                  <option key={categoriaDisponivel} value={categoriaDisponivel} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1.5">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: 29.90"
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1.5">Imagem do produto</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImagem}
                disabled={fazendoUpload}
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-2.5 text-sm focus:outline-none focus:border-verde-normal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-verde-claro file:text-verde-escuro hover:file:bg-verde-normal/20 file:cursor-pointer"
              />
              {fazendoUpload && (
                <p className="text-xs text-amber-500 mt-2 font-semibold animate-pulse">Enviando imagem...</p>
              )}
              {imagem && !fazendoUpload && (
                <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-dourado/40 shadow-sm">
                  <img src={imagem} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-1.5">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ingredientes e detalhes..."
                rows={3}
                className="w-full bg-fundo border border-cinza-borda rounded-xl p-3 text-sm focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15 resize-none transition-all"
              />
            </div>

            {/* Tipo de variação */}
            <div>
              <label className="block text-xs font-bold text-cinza-texto mb-2">Tipo de variação</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "", label: "Simples", icon: null },
                  { value: "tamanho", label: "Tamanho", icon: <Ruler size={14} /> },
                  { value: "peso", label: "Peso", icon: <Weight size={14} /> },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setTipoVariacao(value as "" | "tamanho" | "peso");
                      if (!value) {
                        setOpcoesVariacao([]);
                      } else if (opcoesVariacao.length === 0) {
                        if (value === "tamanho") {
                          setOpcoesVariacao([
                            { opcao: "P", preco: 0 },
                            { opcao: "M", preco: 0 },
                            { opcao: "G", preco: 0 },
                          ]);
                        } else {
                          setOpcoesVariacao([
                            { opcao: "250g", preco: 0 },
                            { opcao: "500g", preco: 0 },
                            { opcao: "1kg", preco: 0 },
                          ]);
                        }
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                      tipoVariacao === value
                        ? "border-verde-normal bg-verde-normal text-white shadow-sm"
                        : "border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal/60"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tipoVariacao && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-cinza-texto mb-1">
                  Opções de {tipoVariacao === "tamanho" ? "tamanho" : "peso"} e preços
                </label>
                {opcoesVariacao.map((opcao, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opcao.opcao}
                      onChange={(e) => {
                        const novas = [...opcoesVariacao];
                        novas[index] = { ...novas[index], opcao: e.target.value };
                        setOpcoesVariacao(novas);
                      }}
                      placeholder={tipoVariacao === "tamanho" ? "Ex: P" : "Ex: 500g"}
                      className="flex-1 bg-fundo border border-cinza-borda rounded-xl p-2.5 text-sm focus:outline-none focus:border-verde-normal"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-2.5 text-xs text-cinza-texto font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={opcao.preco || ""}
                        onChange={(e) => {
                          const novas = [...opcoesVariacao];
                          novas[index] = { ...novas[index], preco: Number(e.target.value) || 0 };
                          setOpcoesVariacao(novas);
                        }}
                        placeholder="0.00"
                        className="w-full bg-fundo border border-cinza-borda rounded-xl pl-8 pr-2 py-2.5 text-sm focus:outline-none focus:border-verde-normal"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpcoesVariacao(opcoesVariacao.filter((_, i) => i !== index))}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-colors shrink-0 cursor-pointer"
                      title="Remover opção"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOpcoesVariacao([...opcoesVariacao, { opcao: "", preco: 0 }])}
                  className="flex items-center gap-1.5 text-xs font-bold text-verde-normal hover:text-verde-destaque transition-colors mt-1 cursor-pointer"
                >
                  <Plus size={14} /> Adicionar opção
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando || fazendoUpload}
              className={`w-full text-white py-3 rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50 cursor-pointer ${
                produtoEditandoId ? "bg-amber-500 hover:bg-amber-600" : "bg-verde-normal hover:bg-verde-destaque"
              }`}
            >
              {salvando ? "Salvando..." : produtoEditandoId ? "Salvar alterações" : "Cadastrar produto"}
            </button>
          </form>

          {/* Categorias */}
          <div className="mt-6 pt-5 border-t border-dourado/30">
            <h3 className="text-sm font-bold text-verde-escuro mb-1.5">Categorias do cardápio</h3>
            <p className="text-xs text-cinza-texto mb-3">Clique em uma categoria para renomeá-la em todos os produtos.</p>
            <div className="flex flex-wrap gap-2">
              {categoriasDisponiveis.map((categoriaDisponivel) => (
                <button
                  key={categoriaDisponivel}
                  type="button"
                  onClick={() => editarCategoria(categoriaDisponivel)}
                  className="px-3 py-1.5 rounded-full border border-cinza-borda bg-fundo text-verde-escuro text-xs font-bold hover:border-dourado/60 hover:text-dourado-escuro transition-colors cursor-pointer"
                >
                  <Edit3 size={12} className="inline mr-1" />
                  {categoriaDisponivel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Lista de produtos ─── */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-cinza-borda/60 shadow-sm">
          <h2 className="text-lg font-bold text-verde-escuro mb-4 pb-4 border-b border-dourado/30 flex items-center gap-2">
            <Utensils size={19} className="text-verde-normal" /> Itens no cardápio
            <span className="text-xs font-bold bg-verde-claro text-verde-escuro px-2 py-0.5 rounded-full">
              {produtos.length}
            </span>
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border border-cinza-borda/40 bg-fundo/40 hover:bg-fundo hover:border-dourado/40 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-200 overflow-hidden relative shrink-0 flex items-center justify-center ring-1 ring-cinza-borda/50">
                      {produto.imagem ? (
                        <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-verde-normal bg-verde-claro/60 px-2 py-0.5 rounded-full">
                          {produto.categoria}
                        </span>
                        {produto.tipoVariacao && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-dourado-escuro bg-dourado-claro/60 px-2 py-0.5 rounded-full border border-dourado/30">
                            {produto.tipoVariacao === "tamanho" ? "⚙ Tamanhos" : "⚙ Pesos"}:{" "}
                            {parseOpcoesVariacao(produto.opcoesVariacao).map((o) => o.opcao).join(", ")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-verde-escuro text-sm sm:text-base truncate">{produto.nome}</h3>
                      <p className="text-xs text-cinza-texto line-clamp-2 sm:line-clamp-1">{produto.descricao}</p>
                      <span className="text-sm font-extrabold text-verde-escuro mt-1 block">
                        {precoFormatado(produto.preco)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => iniciarEdicao(produto)}
                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                      title="Editar produto"
                    >
                      <Edit3 size={17} />
                    </button>
                    <button
                      onClick={() => excluirProduto(produto.id)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-colors cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 size={17} />
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
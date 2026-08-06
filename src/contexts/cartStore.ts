import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TipoVariacao = "tamanho" | "peso" | null;

/** Cada opção de variação tem seu próprio preço */
export interface OpcaoVariacao {
  opcao: string;
  preco: number;
}

/** Faz parse do JSON de opções de variação (formato: [{"opcao":"P","preco":15}]) */
export function parseOpcoesVariacao(json: string | null | undefined): OpcaoVariacao[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o: unknown): o is OpcaoVariacao =>
        typeof o === "object" && o !== null &&
        typeof (o as OpcaoVariacao).opcao === "string" &&
        typeof (o as OpcaoVariacao).preco === "number"
      )
      .map((o) => ({ opcao: String(o.opcao).trim(), preco: Number(o.preco) }))
      .filter((o) => o.opcao);
  } catch {
    // Fallback para formato antigo (comma-separated)
    if (typeof json !== "string") return [];
    return json
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .map((opcao) => ({ opcao, preco: 0 }));
  }
}

/** Serializa array de opções para string JSON (armazenar no banco) */
export function serializarOpcoesVariacao(opcoes: OpcaoVariacao[]): string {
  return JSON.stringify(opcoes.filter((o) => o.opcao && o.preco >= 0));
}

export interface ItemCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  variacao?: string | null;
  tipoVariacao?: TipoVariacao;
}

/** Gera uma chave única que combina produto + variação selecionada */
function chaveItem(item: Pick<ItemCarrinho, "id" | "variacao">): string {
  return item.variacao ? `${item.id}::${item.variacao}` : item.id;
}

interface CartState {
  itens: ItemCarrinho[];
  mesa: string | null;
  adicionarItem: (produto: {
    id: string;
    nome: string;
    preco: number;
    variacao?: string | null;
    tipoVariacao?: TipoVariacao;
  }) => void;
  removerItem: (id: string, variacao?: string | null) => void;
  alterarQuantidade: (id: string, quantidade: number, variacao?: string | null) => void;
  limparCarrinho: () => void;
  definirMesa: (mesa: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itens: [],
      mesa: null,

      adicionarItem: (produto) =>
        set((state) => {
          const chave = chaveItem(produto);
          const itemExiste = state.itens.find((item) => chaveItem(item) === chave);

          if (itemExiste) {
            return {
              itens: state.itens.map((item) =>
                chaveItem(item) === chave
                  ? { ...item, quantidade: item.quantidade + 1 }
                  : item
              ),
            };
          }

          return {
            itens: [
              ...state.itens,
              {
                id: produto.id,
                nome: produto.nome,
                preco: produto.preco,
                quantidade: 1,
                variacao: produto.variacao ?? null,
                tipoVariacao: produto.tipoVariacao ?? null,
              },
            ],
          };
        }),

      removerItem: (id, variacao) =>
        set((state) => {
          const chave = chaveItem({ id, variacao });
          return { itens: state.itens.filter((item) => chaveItem(item) !== chave) };
        }),

      alterarQuantidade: (id, quantidade, variacao) =>
        set((state) => {
          const chave = chaveItem({ id, variacao });
          if (quantidade <= 0) {
            return { itens: state.itens.filter((item) => chaveItem(item) !== chave) };
          }
          return {
            itens: state.itens.map((item) =>
              chaveItem(item) === chave ? { ...item, quantidade } : item
            ),
          };
        }),

      limparCarrinho: () => set({ itens: [] }),
      definirMesa: (mesa) => set({ mesa }),
    }),
    { name: "lumiere-cart" }
  )
);

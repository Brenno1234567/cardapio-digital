import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ItemCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface CartState {
  itens: ItemCarrinho[];
  adicionarItem: (produto: { id: string; nome: string; preco: number }) => void;
  removerItem: (id: string) => void;
  alterarQuantidade: (id: string, quantidade: number) => void;
  limparCarrinho: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itens: [],

      adicionarItem: (produto) =>
        set((state) => {
          const itemExiste = state.itens.find((item) => item.id === produto.id);

          if (itemExiste) {
            return {
              itens: state.itens.map((item) =>
                item.id === produto.id
                  ? { ...item, quantidade: item.quantidade + 1 }
                  : item
              ),
            };
          }

          return {
            itens: [...state.itens, { ...produto, quantidade: 1 }],
          };
        }),

      removerItem: (id) =>
        set((state) => ({
          itens: state.itens.filter((item) => item.id !== id),
        })),

      alterarQuantidade: (id, quantidade) =>
        set((state) => {
          if (quantidade <= 0) {
            return { itens: state.itens.filter((item) => item.id !== id) };
          }
          return {
            itens: state.itens.map((item) =>
              item.id === id ? { ...item, quantidade } : item
            ),
          };
        }),

      limparCarrinho: () => set({ itens: [] }),
    }),
    { name: "lumiere-cart" }
  )
);

import { Plus } from "lucide-react";
import { useCartStore } from "../contexts/cartStore";

interface CardProdutoProps {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
}

const IMAGEM_PADRAO = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";

export default function CardProduto({ id, nome, descricao, preco, imagem }: CardProdutoProps) {
  const adicionarItem = useCartStore((state) => state.adicionarItem);

  const precoFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);

  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-cinza-borda/50 flex gap-3 sm:gap-4 items-stretch sm:items-center min-w-0 w-full h-full">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl shrink-0 overflow-hidden">
        <img
          src={imagem || IMAGEM_PADRAO}
          alt={nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-bold text-verde-escuro leading-tight truncate">{nome}</h3>
        <p className="text-sm text-cinza-texto line-clamp-2 mt-1">{descricao}</p>
        <div className="flex justify-between items-center gap-2 mt-auto pt-3">
          <span className="font-bold text-verde-normal text-sm sm:text-base shrink-0">{precoFormatado}</span>

          <button
            onClick={() => adicionarItem({ id, nome, preco })}
            className="bg-verde-normal text-white p-1.5 rounded-full shadow-md hover:bg-verde-destaque transition-colors active:scale-95 shrink-0"
            aria-label={`Adicionar ${nome} ao carrinho`}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

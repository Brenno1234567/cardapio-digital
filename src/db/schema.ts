import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// Tabela de Produtos do Cardápio
export const produtos = sqliteTable("produtos", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  preco: real("preco").notNull(),
  categoria: text("categoria").notNull(),
  status: text("status").notNull().default("Ativo"),
  imagem: text("imagem"),
});

// Tabela de Pedidos
export const pedidos = sqliteTable("pedidos", {
  id: text("id").primaryKey(),
  mesa: text("mesa").notNull(),
  cliente: text("cliente").notNull(),
  status: text("status").notNull().default("pendente"),
  observacao: text("observacao"),
  total: real("total").notNull(),
  criadoEm: integer("criado_em", { mode: "timestamp" }).notNull(),
});

// Tabela de Itens do Pedido
export const itensPedido = sqliteTable("itens_pedido", {
  id: text("id").primaryKey(),
  pedidoId: text("pedido_id").notNull(),
  produtoNome: text("produto_nome").notNull(),
  quantidade: integer("quantidade").notNull(),
  precoUnitario: real("preco_unitario").notNull(),
});

// Tabela de Configurações do Sistema
export const configuracoes = sqliteTable("configuracoes", {
  id: text("id").primaryKey(),
  nomeRestaurante: text("nome_restaurante").notNull(),
  statusLoja: integer("status_loja", { mode: "boolean" }).notNull(),
  tempoPreparo: text("tempo_preparo").notNull(),
});

// Tabela de Usuários / Colaboradores (Corrigida para SQLite e com os campos corretos)
export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  cargo: text("cargo").notNull(),
  pin: text("pin").notNull(),
});

export const tentativasLogin = sqliteTable("tentativas_login", {
  identificador: text("identificador").primaryKey(),
  tentativas: integer("tentativas").notNull().default(0),
  bloqueadoAte: integer("bloqueado_ate"),
  atualizadoEm: integer("atualizado_em").notNull(),
});

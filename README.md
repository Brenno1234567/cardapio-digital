# Meu Cardápio — Sistema de Restaurante

Aplicação full-stack em **Next.js 16 + Drizzle ORM + Turso (SQLite)** para cardápio digital, pedidos e painel da cozinha.

## Rotas principais

| Rota | Público | Descrição |
|------|---------|-----------|
| `/cardapio` | Sim | Cardápio do cliente (QR Code: `/cardapio?mesa=12`) |
| `/` | Sim | Redireciona para `/cardapio` |
| `/carrinho` | Sim | Finalizar pedido |
| `/painel-pedidos` | Funcionário | Painel de pedidos em tempo quase real |
| `/admin` | Admin | Gerenciar produtos |
| `/users` | Admin | Gerenciar equipe (PIN) |
| `/settings` | Admin | Nome do restaurante, loja aberta/fechada |
| `/login` | — | Login por PIN |

## Desenvolvimento local

```bash
npm install
npm run db:setup    # cria tabelas + dados iniciais (usa dev.db)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

**Primeiro acesso (admin):** com o servidor rodando, crie o usuário inicial:

```bash
curl -X POST http://localhost:3000/api/auth/setup
```

Login em `/login` com PIN **1234**. Altere o PIN em `/users` após entrar.

## Deploy — Fase 1 (Vercel + Turso)

O projeto hoje roda como **monolito Next.js** (frontend + API no mesmo repositório). Isso é suficiente para publicar agora. A separação em backend no Render com WebSocket fica para a Fase 2.

### 1. GitHub

```bash
git add .
git commit -m "Sistema de cardápio com Next.js, Drizzle e Turso"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/meu-cardapio-front.git
git push -u origin main
```

### 2. Turso (banco de dados)

1. Crie conta em [turso.tech](https://turso.tech)
2. Instale a CLI: `curl -sSfL https://get.tur.so/install.sh | bash` (ou via npm: `npm i -g @tursodatabase/turso`)
3. No terminal:

```bash
turso auth login
turso db create meu-cardapio
turso db show meu-cardapio --url
turso db tokens create meu-cardapio
```

4. Copie `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` para um arquivo `.env` local e rode:

```bash
npm run db:setup
curl -X POST http://localhost:3000/api/auth/setup -H "X-Setup-Secret: SEU_SEGREDO"
```

> Em produção, defina `SETUP_SECRET` na Vercel e envie o header `X-Setup-Secret` ao chamar `/api/auth/setup` uma única vez.

### 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → importe o repositório GitHub
2. **Environment Variables** (Production):

| Variável | Valor |
|----------|-------|
| `TURSO_DATABASE_URL` | URL do Turso |
| `TURSO_AUTH_TOKEN` | Token do Turso |
| `SETUP_SECRET` | String aleatória longa (opcional, recomendado) |

3. Deploy. Após o deploy, crie o admin (se ainda não criou):

```bash
curl -X POST https://SEU-DOMINIO.vercel.app/api/auth/setup -H "X-Setup-Secret: SEU_SEGREDO"
```

### 4. QR Code do cardápio

Gere um QR apontando para:

```
https://SEU-DOMINIO.vercel.app/cardapio?mesa=01
```

## Fase 2 (futuro) — Render + WebSocket

Para tempo real instantâneo (sem polling de 5s na cozinha):

- Extrair API para repositório `meu-cardapio-api` (Express + Socket.io)
- Hospedar no Render (Web Service)
- Frontend na Vercel consome `NEXT_PUBLIC_API_URL` + conexão WSS
- CORS restrito ao domínio Vercel + JWT para rotas protegidas

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Sincroniza schema com o banco |
| `npm run db:seed` | Insere dados iniciais |
| `npm run db:setup` | `db:push` + `db:seed` |
| `npm run db:studio` | Interface visual do banco |

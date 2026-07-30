# Meu Cardápio

Aplicação web para cardápio, pedidos, atendimento e administração de produtos.

## Tecnologias

- Next.js e React
- TypeScript
- Drizzle ORM com Turso/libSQL
- Pusher para atualizações em tempo real
- Cloudinary para imagens

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure as variáveis de `.env.local` antes de usar integrações externas. Nunca envie esse arquivo ao GitHub.

## Publicar no GitHub

```bash
git add .
git commit -m "chore: estrutura inicial do projeto"
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin main
```

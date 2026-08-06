---
kind: build_system
name: Next.js + Drizzle Build & Dev Workflow
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - drizzle.config.ts
    - tsconfig.json
    - postcss.config.mjs
    - eslint.config.mjs
---

## Build System Overview

This repository is a **Next.js App Router** application (Next.js 16.2.11, React 19) with no custom build orchestration beyond the framework defaults and Drizzle ORM tooling. There are no Makefiles, Dockerfiles, CI pipelines, or release scripts in the repository root — the project relies on Next.js built-in commands and npm scripts for all build, dev, and database operations.

## Key Files and Scripts

- `package.json` — defines all build/dev lifecycle scripts:
  - `dev`: `next dev` — development server
  - `build`: `next build` — production build (static output)
  - `start`: `next start` — serves the production build
  - `lint`: `eslint` — linting via ESLint 9
  - Database: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`, `db:setup` (push + seed)
- `next.config.ts` — minimal Next.js config enabling AVIF/WebP image formats and whitelisting Cloudinary/Unsplash as remote image sources
- `drizzle.config.ts` — Drizzle Kit configuration using the `turso` dialect; schema lives at `./src/db/schema.ts`, migrations output to `./drizzle`, and the database URL resolves from `TURSO_DATABASE_URL` env var falling back to local `file:dev.db`
- `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs` — standard TypeScript, Tailwind CSS v4, and ESLint configs used by the build pipeline

## Architecture and Conventions

- **Framework-native build**: The entire build pipeline is driven by Next.js. `npm run build` produces an optimized production bundle; `npm run start` runs the Node server that serves it. No custom Webpack/Vite overrides exist.
- **Database migration workflow**: Schema changes go through Drizzle Kit (`db:generate` → `db:migrate` / `db:push`). Local development uses SQLite via Turso's `file:` protocol (`dev.db`), while production targets a Turso/libSQL instance via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- **Environment-driven runtime**: The build itself does not embed environment-specific behavior; runtime behavior (database target, auth providers, cloud storage) is controlled by environment variables consumed at runtime by the app code and Drizzle config.
- **Dual workspace**: A sibling directory `reserva/cardapio-local/` mirrors the same Next.js + Drizzle setup (with its own `package.json`, `.env.local`, and `scripts/load-test.ts`), suggesting a local-only deployment variant but sharing the same build approach.

## Conventions and Constraints

- **No containerization or CI**: There are no Dockerfiles, docker-compose files, GitHub Actions workflows, or other CI/CD artifacts in this repository. Deployment is expected to be done by hosting the Next.js output (e.g., Vercel, Node server).
- **No cross-compilation or multi-target builds**: The project targets a single Node.js runtime via Next.js; there are no platform-specific build steps.
- **Linting is part of the script surface**: `npm run lint` invokes ESLint 9 with the Next.js ESLint config; no pre-commit hooks are defined in package.json.
- **Database seeding is a first-class step**: `db:setup` combines `drizzle-kit push` and `tsx src/db/seed.ts`, making initial data population a documented one-command operation.
- **Image optimization is configured**: The build enables AVIF and WebP output formats and restricts allowed remote image hosts to Cloudinary and Unsplash, which affects how images are processed during `next build`.
---
kind: configuration_system
name: Environment-Based Configuration via process.env
category: configuration_system
scope:
    - '**'
source_files:
    - reserva/cardapio-local/.env.example
    - src/db/index.ts
    - drizzle.config.ts
    - src/lib/firebase-client.ts
    - src/app/api/upload/route.ts
    - src/app/api/auth/setup/route.ts
    - scripts/load-test.ts
---

The Meu Cardápio application uses a straightforward environment-variable-based configuration system with no dedicated config loader library. All runtime configuration is consumed directly through `process.env` across the codebase, following Next.js conventions for variable exposure.

**What system/approach is used**
- Pure `process.env` access — no dotenv, type-safe config modules, or centralized config objects are used.
- Next.js built-in environment handling: variables prefixed with `NEXT_PUBLIC_` are exposed to the client; all other variables remain server-only.
- Per-tool configuration files (`next.config.ts`, `drizzle.config.ts`) that read from `process.env` at module load time.
- A `.env.example` template documents required and optional variables.

**Key files and packages**
- `src/db/index.ts` — database connection reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, falling back to local `file:dev.db` when Turso vars are absent.
- `drizzle.config.ts` — Drizzle Kit configuration reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- `src/lib/firebase-client.ts` — client-side Firebase initialization reads `NEXT_PUBLIC_FIREBASE_*` variables and throws if any are missing.
- `src/app/api/upload/route.ts` — Cloudinary SDK configured at module scope using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `src/app/api/auth/setup/route.ts` — setup endpoint protected by an optional `SETUP_SECRET` env var checked via the `x-setup-secret` request header.
- `reserva/cardapio-local/.env.example` — canonical list of all supported environment variables with comments explaining local vs production usage.
- `scripts/load-test.ts` — custom `.env.loadtest` parser for load-testing scripts, separate from the app's runtime env.

**Architecture and conventions**
- **No central config module**: each file imports `process.env` directly where it needs a value. There is no single source-of-truth config object.
- **Fallback defaults**: several values have sensible defaults (e.g., `TURSO_DATABASE_URL ?? "file:dev.db"`), allowing local development without any env vars set.
- **Client/server split**: public-facing keys use the `NEXT_PUBLIC_` prefix so they are bundled into the client bundle; secrets like `TURSO_AUTH_TOKEN`, `CLOUDINARY_API_SECRET`, and `SETUP_SECRET` stay server-only.
- **Per-service initialization**: third-party services (Firebase, Cloudinary, Turso) are initialized at module scope in their respective files, reading env vars immediately on import.
- **Optional hardening**: features can be gated behind env checks (e.g., Google login throws if Firebase keys are missing; setup endpoint requires `SETUP_SECRET` when defined).

**Conventions and constraints**
- Environment variables are documented in `reserva/cardapio-local/.env.example`; this file serves as the de facto contract for what must be provided per environment.
- Database connection falls back to a local SQLite file (`dev.db`) when `TURSO_DATABASE_URL` is not set, enabling zero-config local development.
- The setup route enforces an optional `SETUP_SECRET` guard: if the variable is defined, requests must include the matching `x-setup-secret` header or receive a 403.
- Load-test scripts require their own `.env.loadtest` file with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, validated at startup with an explicit error message.
- No validation schema or type-checking is applied to `process.env` values at runtime beyond basic presence checks (e.g., Firebase client throws when keys are missing).
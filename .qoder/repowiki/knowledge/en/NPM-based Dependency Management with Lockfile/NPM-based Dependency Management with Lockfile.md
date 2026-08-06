---
kind: dependency_management
name: NPM-based Dependency Management with Lockfile
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - reserva/cardapio-local/package.json
---

This repository uses **npm** as its package manager for dependency management, with a standard Node.js/Next.js project structure. The system is straightforward and conventional:

**Declaration & Versioning**
- Dependencies are declared in `package.json` at both the root (`meu-cardapio-front`) and the local development copy under `reserva/cardapio-local/`.
- Runtime dependencies use caret ranges (e.g., `^0.17.4`, `^3.0.3`, `^2.10.0`, `^0.45.2`, `^12.17.0`, `^1.25.0`, `^5.0.14`) allowing minor/patch updates within the specified major version.
- Core framework versions like `next`, `react`, `react-dom`, and `eslint-config-next` are pinned to exact versions (e.g., `16.2.11`, `19.2.4`).
- Dev dependencies include TypeScript, ESLint, Drizzle Kit, Tailwind CSS v4, and tsx for running TypeScript scripts.

**Lockfile Strategy**
- A `package-lock.json` file is committed alongside `package.json`, ensuring deterministic installs across environments. The lockfile is at `lockfileVersion: 3`.
- No `node_modules` directory is committed; it is excluded via `.gitignore`.

**No Vendoring or Private Registries**
- There is no `vendor/` directory, no `.npmrc` configuration, no private registry setup, and no proxy configuration for npm.
- All packages are resolved from the public npm registry.

**Monorepo Structure**
- The project has two parallel `package.json` files: the main application at the root and a local development copy under `reserva/cardapio-local/`. Both have nearly identical dependency sets, suggesting a dual-environment setup rather than a true monorepo with shared node_modules.

**Database Dependencies**
- Database access uses `@libsql/client` with `drizzle-orm` and `drizzle-kit` for schema management, migrations, and seeding via npm scripts (`db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:setup`).

**Key Constraints**
- The project requires Node.js compatible with the engines specified by dependencies (e.g., `>=10`, `>=6.9` for various packages).
- Both `package.json` files are marked as `"private": true`, indicating these are not intended to be published to npm.
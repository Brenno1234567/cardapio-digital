---
kind: error_handling
name: Next.js Route Handlers with Centralized Auth, Rate-Limiting, and Consistent JSON Error Responses
category: error_handling
scope:
    - '**'
source_files:
    - src/lib/auth.ts
    - src/lib/login-rate-limit.ts
    - src/app/api/auth/login/route.ts
    - src/app/api/auth/google/route.ts
    - src/app/api/pedidos/route.ts
    - src/app/api/produtos/route.ts
    - src/app/api/upload/route.ts
---

## Overview

The Meu Cardápio project is a Next.js App Router application that handles errors primarily at the API route-handler level. There is no global error middleware (no `error.ts`/`not-found.ts` in `src/app`, no custom `next.config.ts` error handling). Instead, each route wraps its body in a `try/catch` block and returns structured JSON responses via `NextResponse.json`. Errors are never thrown out of handlers; they are caught locally and translated into HTTP status codes.

## Error Response Shape

Every error response follows a consistent shape:
- `{ error: string }` — human-readable message in Portuguese.
- A numeric HTTP status code set as the second argument to `NextResponse.json`.

Common statuses observed across routes:
| Status | Meaning | Example sources |
|--------|---------|----------------|
| `201` | Created (new order) | `src/app/api/pedidos/route.ts` POST |
| `400` | Bad request / validation failure | login PIN length, missing fields, invalid upload type/size, invalid item quantity |
| `401` | Unauthorized (invalid token, auth failure) | Google login fallback catch block |
| `403` | Forbidden (no access / store closed) | unauthorized Google account, store closed (`statusLoja === false`) |
| `429` | Too many attempts (rate-limited) | login rate limiter |
| `500` | Internal server error (unhandled exception) | any route's catch block |

There is no centralized error class or enum; messages are inline strings in Portuguese.

## Authentication & Authorization Errors

Auth logic lives in `src/lib/auth.ts` and provides reusable helpers:
- `requireAuth(allowed: Cargo[])` — returns `{ role }` on success or a `NextResponse` with `{ error: "Não autorizado." }` (401) if no cookie is present, or `{ error: "Sem permissão." }` (403) if the role is insufficient.
- `requireAdmin()` and `requireKitchen()` are thin wrappers around `requireAuth`.
- `isNextResponse(value)` is used by callers to short-circuit when an authorization helper already returned a response.

Authorization checks run **before** business logic in every protected route (e.g., `produtos/route.ts`, `upload/route.ts`, `pedidos/route.ts`).

## Input Validation Errors

Validation is done inline inside each handler, returning 400 responses with descriptive messages:
- `auth/login/route.ts`: PIN required, PIN length between 4–8 characters.
- `auth/google/route.ts`: `idToken` must be a non-empty string.
- `produtos/route.ts`: `nome` required, `preco` must be a number ≥ 0.
- `pedidos/route.ts`: `itens` must be a non-empty array; each item needs a valid name, positive integer quantity ≤ 99, and either a valid product id or a non-negative price; `mesa` must match `Mesa <number>` or be `balcao`; total must be > 0; allowed status values for PATCH are enumerated.
- `upload/route.ts`: file must exist, type must be one of JPEG/PNG/WEBP/GIF, size ≤ 5 MB.

Parsing failures use `.catch(() => null)` on `request.json()` so malformed bodies become 400s rather than uncaught exceptions.

## Rate Limiting Errors

Login attempts are rate-limited via `src/lib/login-rate-limit.ts`, which persists failed attempts in a `tentativas_login` SQLite table created lazily on first use. After `MAX_FAILED_ATTEMPTS` (5) failures within `LOCKOUT_MS` (15 minutes), subsequent requests receive:
```json
{
  "error": "Muitas tentativas. Tente novamente em X minuto(s).",
  "retryAfterSeconds": N
}
```
with HTTP 429 and a `Retry-After` header. The same module exposes `checkLoginRateLimit`, `registerFailedLogin`, and `clearLoginRateLimit`, which are called at the top of `auth/login/route.ts` and `auth/google/route.ts` before processing credentials.

## External Service Failures

Failures calling external services are isolated in their own `try/catch` blocks so they do not break the primary flow:
- Pusher notifications in `pedidos/route.ts` (POST/PATCH) are wrapped in `try/catch` and logged via `console.error`; the handler still returns success even if Pusher fails.
- Cloudinary upload in `upload/route.ts` is wrapped in a `try/catch` that returns a 500 JSON error.
- Google identity lookup in `auth/google/route.ts` falls through to the outer catch, which returns 401.

## Database Errors

Database operations use Drizzle ORM. Errors from `db.transaction(...)` or individual queries bubble up to the route-level `catch` block, which logs via `console.error` and returns a generic 500 JSON response. There is no domain-specific error mapping (e.g., unique constraint violations are not distinguished).

## No Global Error Boundary

- There is no `src/app/error.ts` or `src/app/not-found.ts`.
- There is no custom `next.config.ts` error handler.
- The root layout (`src/app/layout.tsx`) does not install any error boundary.
- Client-side pages do not appear to implement React error boundaries based on the scanned files.

This means unhandled Promise rejections or thrown errors in page components would surface as Next.js default error pages, while API routes always return JSON.

## Conventions Observed

1. Every route handler uses `try/catch` and returns `NextResponse.json({ error: ... }, { status })` in the catch branch.
2. All user-facing error messages are in Brazilian Portuguese.
3. Authorization is enforced via `requireAuth`/`requireAdmin`/`requireKitchen` helpers before business logic.
4. Input validation returns 400 with specific field-level messages.
5. Rate limiting is applied to login endpoints using a persistent SQLite table and returns 429 with `Retry-After`.
6. Non-critical side effects (Pusher events) are fire-and-forget with isolated try/catch blocks.
7. Successful mutations return `{ success: true, ... }` payloads alongside appropriate status codes (e.g., 201 for new orders).
8. Sensitive internal details (stack traces, DB errors) are never exposed to clients — only generic messages like "Erro interno no servidor".
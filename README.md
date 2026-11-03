# StudySync

Plataforma educativa (dashboard de estudiante, profesor y admin, más sitio
público). Monolito Next.js con BFF GraphQL integrado y persistencia propia
(Prisma + PostgreSQL).

## Stack

- **Next.js 16** (App Router, Server + Client Components).
- **React 19**.
- **TypeScript**.
- **Auth.js v5** (`strategy: 'jwt'` puro, sin tokens externos).
- **Prisma + PostgreSQL** (local vía Docker Compose).
- **`bcryptjs`** para hashing de contraseñas.
- **URQL** + `@urql/exchange-graphcache` (cliente GraphQL del dashboard).
- **GraphQL Yoga** como BFF en `/api/graphql`.
- **`next-intl`** (español e inglés).
- **`react-hook-form` + `zod`**.
- **Tailwind CSS v4**.

## Requisitos

- Node.js ≥ 20.9 (lo exige Next.js 16).
- `pnpm` (ver `packageManager` en `package.json`).
- Docker y Docker Compose.

## Setup local

### 1. Dependencias

```bash
pnpm install
```

### 2. Base de datos

```bash
docker compose up -d
docker compose ps   # esperar a que el contenedor esté "healthy"
```

### 3. Variables de entorno

```bash
cp .env.example .env
# Generar AUTH_SECRET y pegarlo en .env
openssl rand -base64 32
```

### 4. Migraciones y seed

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. Desarrollo

```bash
pnpm dev
```

## Modos de ejecución

| `BACKEND_MODE`    | Fuente de datos                       | Cuándo                  |
| ----------------- | ------------------------------------- | ----------------------- |
| `local` (default) | PostgreSQL (Docker)                   | Desarrollo con DB real. |
| `mock`            | En memoria (`globalThis.__mockStore`) | Demos, tests, Vercel.   |

## Scripts

| Comando                 | Descripción                   |
| ----------------------- | ----------------------------- |
| `pnpm dev`              | Servidor de desarrollo.       |
| `pnpm build`            | Build de producción.          |
| `pnpm start`            | Servidor de producción.       |
| `pnpm lint`             | ESLint.                       |
| `pnpm type-check`       | TypeScript (sin emitir).      |
| `pnpm format`           | Prettier.                     |
| `pnpm graphql:validate` | Valida el schema GraphQL.     |
| `pnpm graphql:codegen`  | Regenera tipos y `schema.ts`. |
| `pnpm mock:test`        | Suite del mock (in-process).  |

## Estructura del proyecto

```text
docs/
  backend-api/              Contrato interno de métodos (v2.0)
  backend-monolith-plan.md  Plan de migración a monolito
  user-settings-plan.md     Plan de User Settings (fases 0–5)
prisma/
  schema.prisma             Modelos de Prisma
  migrations/               Migraciones
  seed.ts                   Datos de desarrollo
src/
  app/                      App Router
  lib/
    domain/                 Lógica de negocio (Fase C)
    backend/                Interfaz BackendClient + LocalBackendClient
    db/prisma.ts            Singleton de PrismaClient
    schemas/                Zod
    errors/                 Códigos de error
  graphql/                  Schema, resolvers, operations, generated
```

## Documentación

- `docs/backend-api/` — Contrato interno de métodos.
- `docs/backend-monolith-plan.md` — Plan de migración a monolito.
- `docs/user-settings-plan.md` — Plan de User Settings.

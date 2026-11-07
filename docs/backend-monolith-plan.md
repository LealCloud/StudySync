# Plan de implementación: migración a monolito con Auth.js puro

> Documento vivo. Se actualiza conforme avanza el trabajo.  
> Fuente de verdad para la migración arquitectónica del proyecto.
>
> **Estado:** Fases A–I completas. Plan cerrado.
>
> **Documento hermano:** `docs/user-settings-plan.md` documenta las fases 0–5
> ya cerradas (User Settings). Este documento **no** reemplaza ese plan; lo
> referencia y documenta el cambio arquitectónico que afecta a todo el proyecto.

---

## 1. Contexto

### 1.1 Qué cambia

Hasta ahora el proyecto era un **frontend Next.js + BFF GraphQL** que hablaba
con un **backend externo** (REST, Spring Boot, `API_BASE_URL`) a través de
`RestBackendClient`. El backend externo:

- Autenticaba (`POST /auth/login`, `/auth/refresh`, `/auth/logout`).
- Validaba y persistía todos los datos de User Settings (36 endpoints REST).
- Emitía access + refresh tokens con rotación.
- Gestionaba las sesiones activas (`GET /users/me/security` → `sessions[]`).
- Enviaba correos de recuperación y verificación.
- Gestionaba el rate limiting de auth y contacto.

El backend externo se elimina. Toda la lógica pasa a ser responsabilidad de
este servicio monolítico (Next.js + BFF GraphQL + persistencia propia).

### 1.2 Qué se conserva

- **El mock** (`MockBackendClient`, `MockPublicBackendClient`) sigue siendo un
  **modo de ejecución** completo. `BACKEND_MODE=mock` permite levantar
  `pnpm dev` sin base de datos, para demos y desarrollo.
- **La interfaz `BackendClient`** (`src/lib/backend/client.ts`) se conserva
  como contrato interno. Los resolvers GraphQL no cambian.
- **El contrato documental** (`docs/backend-api/`) se conserva como
  **contrato interno de métodos**, no como contrato REST entre servicios.
- **Las validaciones** (`src/lib/schemas/primitives.ts`) y los códigos de
  error (`src/lib/errors/*`) se conservan.

### 1.3 Qué desaparece

- `src/lib/backend/rest/client.ts` (`RestBackendClient`).
- `src/lib/backend/http.ts` (`RestBackendResponse`, `readBackendErrorCode`,
  `isBackendRateLimited`, `isInvalidResetToken`).
- `API_BASE_URL` y `BACKEND_MODE=rest` en `.env.example`.
- `scripts/test-backend.ts` (suite de integración contra el REST real).
- El flujo de access + refresh token en `src/auth.ts`
  (`refreshAccessToken`, `refreshInFlight`, `TokenPairSchema`,
  `RefreshTokenExpired`, `RefreshTokenError`, `events.signOut`).
- `SessionsSection.tsx` y `SecuritySettings.sessions` (decisión D-7 = B).
- `session.error` en `Session` y `JWT` (decisiones D-4.1 y D-4.2).

### 1.4 Stack de destino

- **Next.js 16** (App Router).
- **Auth.js v5** (`next-auth`) con `strategy: 'jwt'` **puro**. Sin access ni
  refresh tokens externos. La sesión es un JWT firmado por Auth.js, con
  `maxAge` y renovación automática.
- **Prisma + PostgreSQL** (nuevo, `postgres:16` vía Docker Compose).
- **`bcryptjs`** para hashing de contraseñas.
- **`@upstash/ratelimit` + `@upstash/redis`** (se conserva; sigue siendo
  necesario en el monolito).
- **`zod`** para validación (se conserva).

---

## 2. Decisiones cerradas

| #     | Decisión                                    | Valor                                                           | Notas                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1   | ORM + DB                                    | **Prisma + PostgreSQL**                                         | DB nueva, sin migración de datos                                                                                                                                                                                                                                                                                                                                                                         |
| D-2   | Indirección `services/`                     | **Conservar** la interfaz `BackendClient`                       | Los resolvers GraphQL no cambian                                                                                                                                                                                                                                                                                                                                                                         |
| D-3   | Modo `mock`                                 | **Modo de ejecución** (`BACKEND_MODE=mock`)                     | `pnpm dev` sin DB funciona                                                                                                                                                                                                                                                                                                                                                                               |
| D-4   | Auth                                        | **Auth.js puro** (sin access/refresh externos)                  |                                                                                                                                                                                                                                                                                                                                                                                                          |
| D-4.1 | `session.user`                              | **`{ id, role }`**                                              | Se elimina `error` y los tokens del JWT                                                                                                                                                                                                                                                                                                                                                                  |
| D-4.2 | `RefreshTokenExpired` / `RefreshTokenError` | **Eliminados**                                                  | Auth.js redirige solo                                                                                                                                                                                                                                                                                                                                                                                    |
| D-5   | Contrato `docs/backend-api/`                | **Contrato interno de métodos**                                 | Se conserva el contenido, cambia el marco                                                                                                                                                                                                                                                                                                                                                                |
| D-6   | Route handlers                              | **Conservar**, llaman a funciones de dominio                    | No se migran a Server Actions                                                                                                                                                                                                                                                                                                                                                                            |
| D-7   | `mySecuritySettings.sessions`               | **B — eliminar**                                                | Se borra `SessionsSection.tsx` y se actualiza el contrato                                                                                                                                                                                                                                                                                                                                                |
| D-8   | Hash de contraseñas                         | **`bcryptjs`**                                                  | Sin binarios, portable                                                                                                                                                                                                                                                                                                                                                                                   |
| D-9   | Migración de datos                          | **No** (proyecto académico)                                     | Arranca con DB vacía + seed                                                                                                                                                                                                                                                                                                                                                                              |
| D-9.1 | PostgreSQL                                  | **Docker Compose** (`postgres:16`) en local; **mock en Vercel** | `DATABASE_URL` en `.env.local` para desarrollo. En Vercel, la demo corre con `BACKEND_MODE=mock` y no se conecta a PostgreSQL (trabajo académico, sin costos). Docker Compose no se usa en producción.                                                                                                                                                                                                   |
| D-10  | Alcance del mock                            | **A corto plazo: reimplementa** (como hoy)                      | B (compartir lógica) queda como mejora futura                                                                                                                                                                                                                                                                                                                                                            |
| D-11  | Firma de `LocalBackendClient`               | **C-1: recibe `userId` en el constructor**                      | Respeta D-2 (resolvers no cambian). El `context()` de Yoga obtiene `session.user.id` vía `auth()` y lo pasa al cliente. Cada método del cliente filtra por `this.userId`. Si en el futuro se necesita multi-tenant o service accounts, se refactoriza a C-2 (userId como primer argumento de cada método).                                                                                               |
| D-12  | `src/lib/backend/services/auth.ts`          | **Eliminar en Fase C.6**                                        | Los route handlers de Fase E y `authorize()` de Fase D llaman directamente a `src/lib/domain/auth.ts`. Una capa menos de indirección, menos superficie de error. `loginWithPassword` se renombra/mueve a `authenticateUser` dentro del dominio.                                                                                                                                                          |
| D-13  | Versión de Prisma                           | **Fijada en 6.x (6.19.3)**                                      | El warning `datasource.url is no longer supported` que aparece en algunos entornos proviene de Prisma 7+ y **no aplica** a nuestro proyecto. Prisma 6 acepta `url = env("DATABASE_URL")` en el bloque `datasource`, y la migración B.3 se aplicó correctamente. No se migra a `prisma.config.ts` hasta que el plan lo requiera explícitamente. Referencia: §"Deudas conocidas" de `Rol y propósito.txt`. |

---

## 3. Arquitectura de destino

### 3.1 Capas

```text
┌─────────────────────────────────────────────────────────────┐
│ React (Server + Client Components)                          │
│ ─ User Settings (9 secciones, ya implementadas)             │
│ ─ Login / Register / Reset / Contact (ya implementados)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ GraphQL (dashboard)
                               │ fetch a /api/auth/* y /api/contact (sitio público)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ BFF GraphQL (/api/graphql) y Route Handlers (/api/*)        │
│ ─ requireAuth / requireRole (sin cambios)                   │
│ ─ Validación con Zod en el borde                            │
│ ─ Traducción de BackendOperationError → GraphQLError        │
└──────────────────────────────┬──────────────────────────────┘
                               │ c.backend.* (interfaz BackendClient)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa de dominio (src/lib/domain/)                           │
│ ─ Lógica de negocio (validación cruzada, reglas de rol,     │
│   semántica PATCH, identityLocked, etc.)                    │
│ ─ Llama al repositorio (Prisma) o al mock (en memoria)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
             ┌─────────────────┴─────────────────┐
             ▼                                   ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│          Prisma          │       │     Mock en memoria      │
│       (PostgreSQL)       │       │   (globalThis.__mock)    │
│      BACKEND_MODE=       │       │    BACKEND_MODE=mock     │
│          local           │       │                          │
└──────────────────────────┘       └──────────────────────────┘
```

### 3.2 `createBackendClient()` de destino

```typescript
// src/lib/backend/index.ts (destino)
function isMockMode(): boolean {
  return process.env.BACKEND_MODE === 'mock';
}

export function createBackendClient(/* sin accessToken */): BackendClient {
  if (isMockMode()) {
    return new MockBackendClient();
  }
  return new LocalBackendClient();
}
```

`LocalBackendClient` implementa `BackendClient` llamando a funciones de
dominio (`authenticateUser`, `updatePersonalData`, etc.) que a su vez usan
Prisma.

### 3.3 Autenticación (Auth.js puro)

```typescript
// src/auth.ts (destino, simplificado)
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
  providers: [
    Credentials({
      async authorize(credentials, request) {
        // 1. Rate limit (IP + email)
        // 2. Validación con loginSchema
        // 3. authenticateUser(email, password) → bcrypt.compare
        // 4. Devuelve { id, role } — nada más
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
```

**Lo que se elimina de `src/auth.ts`:**

- `TokenPairSchema`
- `REFRESH_MARGIN_MS`, `refreshInFlight`, `requestRefresh`, `refreshAccessToken`
- `LoginSuccessResponse`, `isLoginSuccessResponse`
- `UnavailableError` (o se reduce a credenciales inválidas)
- `events.signOut` (o se reduce a log; ver D-7)
- `callbacks.jwt` deja de mirar `accessTokenExpires`

**Lo que se simplifica en `src/types/next-auth.d.ts`:**

- `Session.user` queda en `{ id, role }`.
- Se elimina `Session.error` (`RefreshTokenExpired` / `RefreshTokenError`).
- `User` y `JWT` dejan de tener `accessToken`, `refreshToken`,
  `accessTokenExpires`, `refreshTokenExpires`.

---

## 4. Fases

> **Regla de oro:** cada fase cierra con `pnpm type-check` + `pnpm lint` +
> `pnpm mock:test` (mientras el mock exista). Las fases marcadas como
> **bloqueantes** no se pueden saltar. Las marcadas como **diferibles** se
> pueden cerrar al final si se necesita desbloquear otra cosa.

### Fase A — Decisiones y documentación (bloqueante)

- [x] **A.1** Verificar que las decisiones D-1 a D-10 de §2 están reflejadas
      en este documento (checklist de coherencia).
- [x] **A.2** Reescribir `docs/backend-api/_convenciones/arquitectura.md`
      para reflejar el monolito (sin "API REST del backend", sin `API_BASE_URL`,
      sin "modo `rest`").
- [x] **A.3** Reescribir `docs/backend-api/_convenciones/autenticacion.md`
      para reflejar Auth.js puro (sin access/refresh, `session.user` en
      `{ id, role }`, sin `error`).
- [x] **A.4** Actualizar `docs/backend-api/README.md` (marco interpretativo,
      tabla de endpoints → tabla de métodos de dominio). Eliminar las filas
      22–23 (`DELETE /users/me/security/sessions`).
- [x] **A.5** Actualizar `docs/backend-api/_historico/historial-cambios.md`
      con una entrada `v2.0` que documente el cambio arquitectónico.
- [x] **A.6** Actualizar `.env.example`: eliminar `API_BASE_URL`, conservar
      `BACKEND_MODE`, añadir `DATABASE_URL`.

**Commit sugerido:** `docs(contract): reescribir contrato como monolito con Auth.js puro`

### Fase B — Capa de datos (bloqueante) ✅ CERRADA

- [x] **B.0** Instalar `prisma@^6`, `@prisma/client@^6` y `bcryptjs@^3`
      (con `@types/bcryptjs` descartado: `bcryptjs@3` incluye sus tipos).
      Aprobar builds de Prisma en `pnpm-workspace.yaml`.
      Commit: `5c9a323`.
- [x] **B.0.1** Eliminar `package-lock.json` en favor de `pnpm`.
      Commit: `ae42d93`.
- [x] **B.1** Crear `docker-compose.yml` (`postgres:16`, volumen nombrado,
      healthcheck) y consolidar `.env` (renombrado desde `.env.local`:
      Prisma CLI lee `.env`, no `.env.local`). Reescritura de `README.md`.
      Commit: `667afe7`.
- [x] **B.2** Crear `prisma/schema.prisma` con 14 modelos + 9 enums.
      El schema real difiere del borrador original:
  - `User` (id, email, passwordHash, role, createdAt, updatedAt).
    **No** lleva `image`, `bio`, `interests` (viven en `Profile`).
  - `Profile` (userId, image, bio Json, interests String[]). Relación 1:1.
  - `PersonalData` (userId, firstName, lastName, documentType, documentId,
    phone, country, address, identityLocked). Relación 1:1.
  - `PrivacySettings` (userId, profileVisibility, emailVisibility,
    phoneVisibility, allowDirectMessages). Relación 1:1.
  - `Preferences` (userId, language, theme, timezone, notifications Json,
    accessibility Json). Relación 1:1.
  - `SecuritySettings` (userId, emailVerified, twoFactorEnabled,
    twoFactorSecret). **No** lleva `twoFactorRequired` (se deriva del rol
    en la capa de dominio). Relación 1:1.
  - _(no se crea modelo `Session`: D-7 = B elimina `sessions` del contrato)_
  - `Account` (userId, status, deactivationScheduledAt). Relación 1:1.
  - `Subscription` (id, userId @unique, plan, status, startedAt,
    currentPeriodEnd, cancelAtPeriodEnd). Relación 1:1.
  - `PaymentMethod` (id, userId, brand, last4, expirationMonth,
    expirationYear). Relación 1:N.
  - `Invoice` (id, userId, number, amount Int, currency, status, issuedAt,
    downloadUrl). Relación 1:N. `@@unique([userId, number])`.
  - `Certificate` (id, userId, courseId, courseTitle, certificateNumber,
    issuedAt, downloadUrl). Relación 1:N.
    `@@unique([userId, certificateNumber])`.
  - `CourseEnrollment` (id, userId, courseId, title, progress Float,
    status, enrolledAt, completedAt). Relación 1:N.
    `@@unique([userId, courseId])`.
  - `PasswordResetToken` (id, userId, token @unique, expiresAt, usedAt).
    Relación 1:N.
  - `EmailChangeToken` (id, userId, token @unique, newEmail, expiresAt,
    usedAt). Relación 1:N.
  - Scripts de Prisma en `package.json` (`prisma:generate`, `:validate`,
    `:format`, `:migrate`, `:seed`, `:studio`). Bloque
    `"prisma": { "seed": "tsx prisma/seed.ts" }`.
  - Commits: `bcdc76f`, `9a5af2a`.
- [x] **B.3** `pnpm prisma:migrate --name init` aplicada: migración
      `20261104015947_init`. 14 tablas + `_prisma_migrations` (15 en `\dt`),
      9 enums en `\dT+`, 13 FKs `ON DELETE CASCADE`, uniques e índices
      verificados. Cliente de Prisma regenerado (`v6.19.3`).
      Commit: `c933b2c`.
- [x] **B.4** Crear `prisma/seed.ts` idempotente vía `upsert` por PK.
      **3 usuarios** (no 1):
  - `student@example.com` (datos ricos: subscription `premium`, payment
    method Visa `4242`, invoice `INV-2026-001`, certificate
    `CERT-2026-001`, enrollment `course_graphql_basico` con progress 0.65).
  - `teacher@example.com` (mínimos).
  - `admin@example.com` (mínimos).
  - Password común: `ValidPass1!` (bcryptjs, rounds 10).
  - IDs fijos para determinismo: `usr_student`, `usr_teacher`, `usr_admin`,
    `sub_student`, `pm_student_001`, `inv_student_001`,
    `enr_student_001`, `cert_student_001`.
  - Decisiones: D-B4.1 (seed crudo con `PrismaClient`), D-B4.2 (3
    usuarios), D-B4.3 (import directo de `@prisma/client`), D-B4.4
    (`TODO(seed-shared-prisma)` diferido a después de B.5).
  - Verificado: 2 ejecuciones seguidas sin errores de unique constraint,
    conteos idénticos (`users=3`, `subs=1`, `pms=1`, `invoices=1`,
    `enrollments=1`, `certs=1`).
  - Commit: `07cc9027d893841db00d4608897153400b466705`.
- [x] **B.5** Crear `src/lib/db/prisma.ts` (singleton de `PrismaClient`
      para el runtime de Next.js). Patrón `globalThis.prisma` (D-B5.1),
      `import 'server-only'` como salvaguarda (D-B5.2),
      `logLevels` variable por `NODE_ENV` (D-B5.3), `server-only@0.0.1`
      añadido a `dependencies`.
      Smoke test `SELECT 1` directo validado (`[ { ok: 1 } ]`).
      Nota: el smoke test **no** puede importar `prisma.ts` desde `tsx`
      (el `server-only` lanza por el runtime), por eso se valida con
      `PrismaClient` directo. El singleton en sí queda validado
      indirectamente (mismo constructor, mismo `DATABASE_URL`).
      Commit: `bdee485d1ae51c7461cf7b8ef784dbf683d23142`.

**Commit sugerido:** `feat(db): introducir Prisma y schema inicial`

### Fase C — Capa de dominio (bloqueante) ✅ CERRADA

> **Estado:** ✅ Cerrada el 2026-11-06. C.0 a C.7 completas, incluida
> C.6.1 (sub-fase de desbloqueo). Validaciones: `type-check` 0,
> `lint` 0, `mock:test` 59/59, `domain:test` 6/6.

- [x] **C.0** Auditar el contrato v2.0 (`docs/backend-api/**`) contra los
      tipos `Backend*` en `src/lib/backend/types.ts`.
  - **Motivo:** los tipos se escribieron contra el contrato v1.3.1 (REST
    externo). La Fase A migró el contrato a v2.0 (monolito con Auth.js
    puro), y ese cambio tocó campos que pueden no estar reflejados. Si
    arrancamos C.1 sin auditar, implementaremos la capa de dominio contra
    tipos obsoletos y descubriremos los desfases uno por uno.
  - **Casos conocidos a resolver en C.0:**
    - `BackendSecuritySettings.sessions` → eliminar (D-7 = B, no hay
      modelo `Session`).
    - `BackendLoginData` y todo lo relacionado con tokens externos
      (`BackendTokenPairResponse`, refresh, logout) → evaluar si se
      elimina o se reduce a `{ id, role }` para `authenticateUser`.
    - Resto de interfaces `Backend*` → cruzar contra
      `docs/backend-api/_rutas/**` v2.0 y contra
      `prisma/schema.prisma` (14 modelos + 9 enums).
  - **Entregable:** tabla `Interfaz | Campo | Estado | Acción` en un
    turno de solo lectura, sin tocar código.
  - **Resolución:** parches al archivo `src/lib/backend/types.ts` en
    bloques "antes / después", un bloque por interfaz tocada.
  - **Validación:** `pnpm type-check` + `pnpm lint`. `pnpm mock:test`
    puede romper (el mock todavía usa las interfaces viejas); los
    ajustes al mock se difieren a C.6 o a una sub-fase propia, decisión
    en el momento.
    - **Commit sugerido:** `refactor(types): alinear Backend* con el
contrato v2.0`

  - **Estado:** ✅ Cerrada. Commit `refactor(types): alinear Backend*
con el contrato v2.0` (aplicado el 2026-11-05, hash `6ed6070`).

  - **Notas de cierre:**
    - Se eliminaron `BackendTokenPair`, `BackendTokenPairResponse`,
      `BackendDataResponse<T>` y `BackendLoginResponse`.
    - Se redujo `BackendLoginData` a
      `{ id, role, token, refreshToken, expiresIn, refreshExpiresIn }`.
    - Se ajustaron `PublicBackendClient`, `RestBackendClient` y
      `MockBackendClient` con tipos inline para los sobres
      `{ status, message, data }` de `login` y `refresh`. Los tres
      archivos se tocan/eliminan en C.4/C.6, así que la duplicación es
      transitoria.
    - Se ajustó `isLoginEnvelope` en `services/auth.ts` (que ya no valida
      `firstName`, `lastName`, `subscription` ni `image`) y se introdujo
      `AuthTokenPair` local para `isTokenPair` (el archivo se elimina
      en C.6, D-12).
    - Se difirió la eliminación de `BackendSecuritySession` y
      `BackendSecuritySettings.sessions` a la **Fase G** (`TODO(phase-g)`
      en el código), para no tocar `SessionsSection.tsx` antes de tiempo.
    - Se adelantó la eliminación de `scripts/test-backend.ts` (Fase H.1)
      y del script `"backend:test"` en `package.json`, porque dependían
      de tipos eliminados.
    - Validaciones: `pnpm type-check` (0), `pnpm lint` (0),
      `pnpm mock:test` (59/59).

- [x] **C.1** Crear `src/lib/domain/*` con funciones de negocio, una por
      método de `BackendClient`. Subdividida en dos sub-fases por
      complejidad y para permitir auditoría intermedia. **Estado:**
      ✅ Cerrada vía C.1.a + C.1.b + C.1.c.

  - [x] **C.1.a** Dominio básico (8 archivos, lecturas y PATCH simples):
    - `users.ts`: `getUser`, `getPublicProfile` (matriz de visibilidad),
      `updateProfile` (PATCH anidado de `bio`).
    - `personal-data.ts`: `getPersonalData`, `updatePersonalData`
      (regla `identityLocked`).
    - `privacy.ts`, `preferences.ts` (PATCH con rechazo de `null`).
    - `account.ts`: `getAccount`, `requestAccountDeactivation`,
      `cancelAccountDeactivation`.
    - `courses.ts`, `certificates.ts` (solo lectura).
    - `billing.ts`: `getSubscription`, `getPaymentMethods`, `getInvoices`
      (solo lectura).
    - **Commit:** `727dcfa` (`feat(domain): implementar capa de dominio
básica (C.1.a)`).
    - **Estado:** ✅ Cerrada.
    - **Notas de cierre:**
      - 8 archivos creados, cero imports cruzados entre ellos.
      - `getPublicProfile` aplica la matriz de visibilidad de §8.2.18 y
        devuelve `null` (no 404); el BFF propaga `null`.
      - `updateProfile` usa `Prisma.DbNull` para borrar la bio completa
        y merge parcial para `bio.title` / `bio.description`.
      - `updatePersonalData` rechaza `firstName`/`lastName` nulos con
        `422 VALIDATION_ERROR` y aplica `identityLocked` con rechazo
        atómico (`403 FORBIDDEN`).
      - `updatePrivacy` y `updatePreferences` rechazan `null` con `422`
        (excepciones del contrato §8.2.16, §8.2.18).
      - Todas las fechas se serializan a ISO 8601 (`toISOString()`).
      - Sin validación de roles en el dominio: eso vive en el BFF
        (`requireRole`) y en `LocalBackendClient` (C.2).
      - Validaciones: `pnpm type-check` (0), `pnpm lint` (0),
        `pnpm mock:test` (59/59).

  - [x] **C.1.b** Dominio complejo (4 archivos, lógica cruzada y
        operaciones de escritura):
    - `auth.ts`: `registerUser(input)`,
      `requestPasswordReset(email)`, `validateResetToken(token)`,
      `resetPassword(token, newPassword)`.
      `authenticateUser` se implementa en Fase D (junto con
      `authorize()`).
    - `security.ts`: `getSecuritySettings(userId)`,
      `changePassword`, `beginTwoFactorSetup`, `verifyTwoFactorSetup`,
      `disableTwoFactor`, `revokeSession` (stub 404),
      `revokeOtherSessions` (stub 404).
      `requestEmailChange` se difiere a Fase D/E (requiere integración
      de email).
    - `subscription.ts`: `changePlan(plan)` (transiciones del contrato
      §6), `cancelSubscription(userId)`. La lectura `getSubscription`
      sigue en `billing.ts` (C.1.a).
    - `contact.ts`: `submitContact(input)` (stub con `console.info` +
      `TODO(contact-integration)`).
    - **Tests:** `scripts/test-domain.ts` con 5 tests (5/5 PASS).
      Script `"domain:test"` en `package.json` que usa
      `node --conditions=react-server --import tsx` para poder
      importar el singleton de Prisma (protegido por `server-only`).
    - **Commit:** `8e278b4` (`feat(domain): implementar capa de dominio
compleja (C.1.b)`).
    - **Estado:** ✅ Cerrada.
    - **Notas de cierre:**
      - `registerUser` con `$transaction` atómica (7 inserciones),
        captura `P2002` → `409 CONFLICT`, rol `student` fijo.
      - `requestPasswordReset` / `validateResetToken` / `resetPassword`
        con tokens SHA-256, TTL 1h, un solo uso, doble validación
        dentro del `tx`. Anti-enumeración respetada.
      - `changePassword`: sin revocar otras sesiones (no hay modelo
        `Session` en v2.0).
      - `beginTwoFactorSetup` / `verify` / `disable`: simulación sin
        email. `TODO(two-factor-code-validation)`.
      - `revokeSession` / `revokeOtherSessions`: stubs 404 con
        `TODO(phase-g)`.
      - `changePlan`: upgrade inmediato, downgrade a fin de período,
        `PAYMENT_METHOD_REQUIRED`, `enterprise` prohibido.
      - `cancelSubscription`: solo setea `cancelAtPeriodEnd`,
        sin cambiar plan ni status.
      - Validaciones: `pnpm type-check` (0), `pnpm lint` (0),
        `pnpm mock:test` (59/59), `pnpm domain:test` (5/5).
    - **Deuda registrada para Fase E:**
      - `pendingSetups` en `security.ts` es un `Map` en memoria;
        no funciona en runtime multi-instancia. Persistir el secret
        pendiente antes de Fase E (`TODO(two-factor-persistence)`).

  - [x] **C.1.c** `removePaymentMethod` en el dominio (sub-fase pequeña,
        descubierta al auditar C.2):
    - `billing.ts`: `removePaymentMethod(userId, paymentMethodId)`.
      404 si no existe, 409 si es el último método de una suscripción
      premium `active` (contrato §7). `LocalBackendClient` delega al
      dominio (sin 501).
    - `scripts/test-domain.ts`: 6º test con los 4 casos del contrato.
    - **Commit:** `2669c10` (`feat(domain): implementar removePaymentMethod
(C.1.c)`).
    - **Estado:** ✅ Cerrada.
    - **Notas de cierre:**
      - Añadida `removePaymentMethod` a `billing.ts` con la regla del
        `409 CONFLICT` completa (`plan === 'premium'` **y**
        `status === 'active'` **y** count === 1).
      - `LocalBackendClient.billing.removePaymentMethod` delega al
        dominio (se elimina el `TODO(domain-billing-remove)`).
      - Validaciones: `type-check` 0, `lint` 0, `mock:test` 59/59,
        `domain:test` 6/6.

- [x] **C.2** Crear `src/lib/backend/local/client.ts` con `LocalBackendClient`
      que implementa `BackendClient` llamando a `src/lib/domain/*`.
  - **Estado:** ✅ Cerrada (funcionalmente desde C.3). `LocalBackendClient`
    implementa los 12 grupos de métodos de `BackendClient`, recibe
    `userId` en el constructor (D-11 = C-1) y filtra por `this.userId`.
    `createBackendClient(userId)` en `index.ts` lo instancia en modo
    local. Verificado con `grep` + `tsc --noEmit`.
  - **Notas de cierre:**
    - `grep -n "^export class LocalBackendClient\|userId: string | null"
src/lib/backend/local/client.ts` → `38:export class
LocalBackendClient implements BackendClient` y
      `39:  constructor(private readonly userId: string | null) {}`.
    - `grep -rn "LocalBackendClient" src/lib/backend/index.ts` →
      `2:import { LocalBackendClient } from './local/client';` y
      `13:  return new LocalBackendClient(userId ?? null);`.
    - `tsc --noEmit` sin output.
    - Sin commit propio: el código ya estaba en C.3. Esta entrada es
      solo bookkeeping.
- [x] **C.3** Reescribir `src/lib/backend/index.ts`:
  - `createBackendClient(userId?: string)` (Auth.js puro).
  - `createPublicBackendClient()` sigue existiendo para los route handlers,
    pero en modo local lanza `Error` hasta C.6 (los route handlers del
    sitio público se reescriben en C.6).
  - `src/app/api/graphql/route.ts` usa `session?.user?.id` en lugar de
    `token?.accessToken`. Se elimina `getToken` residual.
  - **Commit:** `dd6d4d4` (junto con C.4+C.7).
  - **Estado:** ✅ Cerrada.
- [x] **C.4** Eliminar `src/lib/backend/rest/client.ts` y sus re-exports
      de `@/lib/backend`.
  - **Commit:** `dd6d4d4` (junto con C.3+C.7).
  - **Estado:** ✅ Cerrada.
  - **Notas:** los consumidores rotos (`routeErrors.ts`,
    `services/call.ts`) se resolvieron en C.7 y en una excepción mínima
    de C.6.
- [x] **C.5** Eliminar `src/lib/backend/http.ts`.
  - **Estado:** ✅ Cerrada, absorbida en C.6.1.
  - **Motivo original de la posposición:** `http.ts` definía
    `RestBackendResponse`, `readBackendErrorCode`,
    `isBackendRateLimited` e `isInvalidResetToken`. Los tres últimos los
    usaba `services/call.ts` (eliminado en C.6), y `RestBackendResponse`
    lo usaban `services/auth.ts` y `services/contact.ts` (eliminados en
    C.6). Al cerrar C.6, `http.ts` quedó sin consumidores.
  - **Cómo se resolvió:** C.6.1 movió `RestBackendResponse<T>` a
    `src/lib/backend/client.ts` (export local), actualizó el import en
    `src/lib/mock/client.ts`, e inlineó `isInvalidResetToken` /
    `isBackendRateLimited` en los route handlers correspondientes.
    Luego se eliminó `http.ts` entero.
  - **Verificación:** `grep -rn "from '@/lib/backend/http'\|from
'../backend/http'\|from './http'" src/ scripts/` → cero resultados.
    `grep -rn "isInvalidResetToken\|isBackendRateLimited\|
readBackendErrorCode" src/ scripts/` → cero resultados.
- [x] **C.6** Eliminar `src/lib/backend/services/*` y reescribir los 5
      route handlers del sitio público para llamar directamente a las
      funciones de dominio (adelanto parcial de Fase E):
  - **Eliminar:**
    - `src/lib/backend/services/auth.ts`.
    - `src/lib/backend/services/contact.ts`.
    - `src/lib/backend/services/call.ts`.
  - **Reescribir** (llamando a `src/lib/domain/*`):
    - `src/app/api/auth/register/route.ts` → `registerUser`.
    - `src/app/api/auth/forgot-password/route.ts` →
      `requestPasswordReset`.
    - `src/app/api/auth/reset-password/route.ts` → `resetPassword`.
    - `src/app/api/auth/validate-reset-token/route.ts` →
      `validateResetToken`.
    - `src/app/api/contact/route.ts` → `submitContact`.
  - **Simplificar:**
    - `src/lib/backend/routeErrors.ts`: `backendRouteError()` sigue
      manejando `BackendOperationError` (útil en los 5 route handlers
      reescritos). Sin cambios funcionales.
  - **Motivo del adelanto de Fase E:** los 5 route handlers son los
    únicos consumidores de `services/*`. Sin reescribirlos, no se puede
    eliminar `services/*`, y sin eliminar `services/*`, C.5 no se puede
    cerrar.
  - **Alcance diferido a Fase E completa:** el resto de route handlers
    (los del dashboard GraphQL, `api/auth/[...nextauth]`) no cambian en
    C.6. Solo los 5 del sitio público.

  - **Estado:** ✅ Cerrada.
  - **Notas de cierre:**
    - Los 5 route handlers llaman a `src/lib/domain/*` con `try/catch`
      inline que traduce `BackendOperationError` a los códigos públicos.
    - `register/route.ts` → `registerUser`, con `CONFLICT → emailTaken`
      y `VALIDATION_ERROR → invalidData`.
    - `forgot-password/route.ts` → `requestPasswordReset`, solo
      `backendRouteError` (anti-enumeración).
    - `reset-password/route.ts` → `resetPassword`, con
      `INVALID_RESET_TOKEN → invalidToken` y
      `VALIDATION_ERROR → invalidData`.
    - `validate-reset-token/route.ts` → `validateResetToken`, con
      `INVALID_RESET_TOKEN → invalidToken`. Respuesta
      `apiOk({ valid: true })` (status 200, idéntico al handler previo).
    - `contact/route.ts` → `submitContact`, con
      `VALIDATION_ERROR → invalidData` y
      `INTERNAL_ERROR → sendFailed`.
    - Eliminados `services/auth.ts`, `services/contact.ts` y
      `services/call.ts`. Carpeta `services/` borrada.
    - Validaciones: `type-check` 0, `lint` 0, `mock:test` 59/59.
      `domain:test` requirió PostgreSQL activo; con la DB `healthy`,
      6/6.
    - Commit `30c42f0` (sin push).
- [x] **C.6.1** Desbloqueo de infraestructura (sub-fase nueva, descubierta
      al auditar C.6):
  - **Motivo:** el plan original asumía que se podía borrar `http.ts`
    sin tocar `client.ts` ni `mock/client.ts`. Falso:
    `src/lib/backend/client.ts` importaba `RestBackendResponse` desde
    `./http`, y `src/lib/mock/client.ts` desde `../backend/http`. Sin
    este desbloqueo, `type-check` fallaba y `mock:test` rompía.
  - **Cambios:**
    - `src/lib/backend/client.ts`: eliminado
      `import type { RestBackendResponse } from './http'`; definido
      `export interface RestBackendResponse<T = unknown> { status:
number; ok: boolean; body: T | null; }` localmente.
    - `src/lib/mock/client.ts`: import ahora viene de
      `../backend/client`.
    - `services/call.ts` y `services/auth.ts`: inlineados los helpers
      `isBackendRateLimited` (solo `status === 429`) e
      `isInvalidResetToken` (solo `status === 400`) antes de eliminar
      los servicios.
  - **Decisión D-C6.7 conservar `PublicBackendClient`,
    `MockPublicBackendClient` y `createPublicBackendClient`:**
    `src/auth.ts` todavía los usa. La migración real es Fase D. Se
    conservan para no romper `mock:test` (`publicApiChecks`) ni el flujo
    de login actual.
  - **Verificación:** `grep -rn
"from '@/lib/backend/http'\|from '../backend/http'\|from './http'"
src/ scripts/` → cero resultados.
  - **Estado:** ✅ Cerrada.
  - **Notas de cierre:**
    - `type-check` (0), `lint` (0), `mock:test` (59/59),
      `domain:test` (6/6).
    - 11 archivos tocados en C.6 + C.6.1 (7 M + 4 D): 5 route handlers
      M, `client.ts` M, `mock/client.ts` M, `services/{auth,contact,
call}.ts` D, `http.ts` D.
    - El recuento de 13 del prompt original era una estimación; el
      diff real es 11 porque `services/auth.ts` y `services/call.ts`
      se modificaron y luego se eliminaron sin commit intermedio (se
      colapsan en D).
    - Commit `30c42f0` (sin push).

- [x] **C.7** `src/lib/backend/routeErrors.ts`: `backendRouteError()` ya no
      maneja `RestBackendNotConfiguredError`. Se simplifica.
  - **Commit:** `dd6d4d4` (junto con C.3+C.4).
  - **Estado:** ✅ Cerrada.

**Commit sugerido:** `feat(domain): implementar lógica de negocio en Prisma`

### Fase D — Autenticación (bloqueante, depende de D-4.1 y D-4.2) ✅ CERRADA

> **Estado:** ✅ Cerrada el 2026-11-06. `authenticateUser` vive en
> `src/lib/domain/auth.ts`. `src/auth.ts` es Auth.js puro con
> `{ id, role }` en sesión y JWT. Eliminados el flujo de tokens
> externos, `PublicBackendClient`, `createPublicBackendClient` y
> `UnavailableError`. Validaciones: `type-check` 0, `lint` 0,
> `mock:test` 59/59, `domain:test` 6/6.

- [x] **D.1** Reescribir `src/auth.ts`:
  - `authorize()` llama a `authenticateUser(email, password)`.
  - Devuelve `{ id, role }`.
  - Se elimina `TokenPairSchema`, `refreshAccessToken`, `refreshInFlight`,
    `LoginSuccessResponse`, `UnavailableError`, `events.signOut`.
  - `callbacks.jwt` solo copia `id` y `role` en el primer login.
  - `callbacks.session` copia `id` y `role` (sin `error`).
  - **Estado:** ✅ Cerrada. `normalizedEmail = email.toLowerCase()` se
    calcula una vez y se reutiliza en rate limit y `authenticateUser`.
    `LoginSuccessResponse` e `isLoginSuccessResponse` también se
    eliminaron (no listados en el prompt original; aparecieron al
    auditar).
- [x] **D.2** Reescribir `src/types/next-auth.d.ts`:
  - `Session.user = { id, role }`.
  - Eliminar `Session.error`.
  - Eliminar tokens de `User` y `JWT`.
  - **Estado:** ✅ Cerrada. `User` y `JWT` conservan `Partial<UserProfile>`
    para los campos `id` y `role`. Sin `accessToken`, `refreshToken`,
    `accessTokenExpires`, `refreshTokenExpires`.
- [x] **D.3** Verificar `src/proxy.ts` (no debería cambiar; solo usa
      `req.auth`).
  - **Estado:** ✅ Cerrada. Sin cambios. `req.auth` + `handleI18nRouting`
    - matcher intactos.
- [x] **D.4** Verificar `LoginForm.tsx` (sigue manejando `code` de
      `CredentialsSignin`; `RateLimitedError` se conserva, `UnavailableError`
      se elimina o se reduce a `invalidCredentials`).
  - **Estado:** ✅ Cerrada. `code === 'unavailable'` eliminado. El
    fallback a `invalidCredentials` cubre los errores de `authenticateUser`.
    Las claves i18n `errors.unavailable` en `src/messages/{es,en}.json`
    quedan huérfanas; se limpian en Fase H.
- [x] **D.5 (nueva)** Eliminar `PublicBackendClient` de
      `src/lib/backend/client.ts` y `createPublicBackendClient` de
      `src/lib/backend/index.ts`. Conservar `MockPublicBackendClient` en
      `src/lib/mock/client.ts` como helper interno (sin `implements`).
  - **Estado:** ✅ Cerrada. `MockPublicBackendClient` conserva sus
    métodos `auth.*` y `contact.submit` para `scripts/test-mock.ts`
    (que no se toca). `mock:test` sigue en 59/59.

**Notas de cierre (2026-11-06):**

- 7 archivos tocados: `src/auth.ts`, `src/lib/domain/auth.ts`,
  `src/types/next-auth.d.ts`, `src/lib/backend/client.ts`,
  `src/lib/backend/index.ts`, `src/lib/mock/client.ts`,
  `src/app/[locale]/(web)/(site)/(auth)/login/LoginForm.tsx`.
- Neto: **+62 / -404** líneas. `src/auth.ts` pasa de 394 a 143 líneas
  (eliminación del 64% del archivo, todo flujo de tokens externos).
- `src/lib/domain/auth.ts`: nueva `authenticateUser(email, password)`.
  `select: { id, role, passwordHash }` (no trae relaciones), `bcrypt.compare`,
  `BackendOperationError(401, UNAUTHENTICATED)` en ambos fallos.
- `src/lib/backend/client.ts`: elimina `PublicBackendClient`. Conserva
  `BackendClient` y `RestBackendResponse<T>` (que el mock sigue usando).
- `src/lib/backend/index.ts`: elimina `createPublicBackendClient`. Solo
  exporta `createBackendClient(userId?)`.
- `src/lib/mock/client.ts`: `MockPublicBackendClient` sin `implements`.
  `contact` con tipo inferido en lugar de `PublicBackendClient['contact']`.
- `LoginForm.tsx`: elimina el caso `code === 'unavailable'`. Queda
  `rateLimited` + fallback `invalidCredentials`.
- Deuda diferida a Fase H: claves i18n huérfanas `errors.unavailable`
  (y posiblemente `errors.unexpected`) en `src/messages/{es,en}.json`.

**Commit sugerido:** `refactor(auth): simplificar a Auth.js puro sin refresh externo`

### Fase E — Route handlers (parcialmente adelantada a C.6)

> **Nota (2026-11-05):** E.1 y E.2 se adelantan a C.6, porque los 5 route
> handlers del sitio público son los únicos consumidores de `services/*`,
> y sin reescribirlos no se puede eliminar `services/*` (ni cerrar C.5).
> El alcance de E.1 y E.2 en C.6 es exactamente el descrito aquí. E.3 se
> resuelve en C.6.

- [x] **E.1** Reescribir `src/app/api/auth/register/route.ts` para llamar
      a `registerUser()` directamente. → **Adelantado a C.6.**
- [x] **E.2** Idem `forgot-password`, `reset-password`,
      `validate-reset-token`, `contact`. → **Adelantado a C.6.**
- [x] **E.3** Verificar que `backendRouteError()` sigue traduciendo
      `BackendOperationError` correctamente. → **Adelantado a C.6.**

**Commit sugerido:** `refactor(routes): route handlers llaman a dominio local` (dentro de C.6)

### Fase F — Resolvers GraphQL y BFF (diferible) ✅ CERRADA

> **Estado:** ✅ Cerrada el 2026-11-06. Los 9 resolvers fuera de
> `security.ts` verificados sin cambios. `security.ts` se modificó en
> Fase G (eliminación de `revokeSession` y `revokeOtherSessions`).
> `route.ts` y `auth.ts` verificados.

- [x] **F.1** Verificar que los 10 resolvers no cambian (si D-2 = A).
  - **Estado:** ✅ Cerrada. 9 resolvers verificados sin cambios:
    `account`, `billing`, `certificates`, `courses`, `personal-data`,
    `preferences`, `privacy`, `profile`, `user`. `security.ts` se
    modifica en G (eliminación de `revokeSession`/`revokeOtherSessions`).
- [x] **F.2** Ajustar `src/app/api/graphql/route.ts`:
  - Contexto: `createBackendClient()` sin `accessToken`.
  - `backendOperationErrorPlugin`: sigue mapeando `BackendOperationError`.
  - **Estado:** ✅ Cerrada sin cambios. Ya usaba
    `session?.user?.id` desde C.3.
- [x] **F.3** Verificar `requireAuth` / `requireRole` (no cambian).
  - **Estado:** ✅ Cerrada sin cambios.

**Commit sugerido:** `refactor(bff): contexto GraphQL sin access token externo`

### Fase G — Security: eliminar subsección de sesiones (diferible, D-7 = B) ✅ CERRADA

> **Estado:** ✅ Cerrada el 2026-11-06. `Session` y `sessions` eliminados
> del schema GraphQL, de la operation, del resolver, del mock, de los
> tipos, del cliente local y del dominio. `SessionsSection.tsx` eliminado.
> `SecurityOverviewClient.tsx` sin sesiones. Mensajes i18n limpiados.
> `graphql:validate` válido.

- [x] **G.1** Actualizar `src/graphql/schema/settings/security.graphql`:
      eliminar `sessions` del tipo `SecuritySettings` y el tipo `Session`.
- [x] **G.2** Actualizar `src/graphql/operations/security/my-security-settings.graphql`
      (eliminar el bloque `sessions { ... }`).
- [x] **G.3** Regenerar `src/graphql/generated/graphql.ts` con
      `pnpm graphql:codegen`.
- [x] **G.4** Borrar `src/app/[locale]/(web)/dashboard/user-settings/SessionsSection.tsx`.
- [x] **G.5** Actualizar `SecurityOverviewClient.tsx`: eliminar
      `<SessionsSection />`, el contador de sesiones del `overview` y los
      mensajes `sessions` de `SecurityOverviewMessages`.
- [x] **G.6** Actualizar `src/messages/{es,en}.json`: eliminar
      `dashboard.userSettings.security.sessions.*` y las claves de
      `overview` de sesiones.
- [x] **G.7** Actualizar `src/lib/mock/client.ts`: eliminar `sessions` de
      `security.getMe`, `revokeSession`, `revokeOtherSessions`, y el
      `MockOperation` correspondiente.
- [x] **G.8** Actualizar `scripts/test-mock.ts`: eliminar los tests
      `revokeSession`, `revokeOtherSessions`, `revokeSession rejects current
session`, `revokeSession accepts a non-current session` y
      `changePassword closes other sessions`.
- [x] **G.9** Actualizar `docs/backend-api/_rutas/users-me/security/password.md`:
      eliminar la mención "el backend revoca todas las sesiones excepto la
      actual" (ya no aplica).
- [x] **G.10** Actualizar `docs/user-settings-plan.md` §5.3 (Security):
      marcar `sessions` como eliminado con referencia a este plan.
- [x] **G.11** Eliminar `BackendSecuritySession` y `sessions` de
      `BackendSecuritySettings` en `src/lib/backend/types.ts`.
- [x] **G.12** Eliminar `revokeSession`/`revokeOtherSessions` de
      `BackendClient['security']` en `src/lib/backend/client.ts`.
- [x] **G.13** Eliminar `revokeSession`/`revokeOtherSessions` de
      `LocalBackendClient.security` en `src/lib/backend/local/client.ts`.
- [x] **G.14** Eliminar los stubs `revokeSession`/`revokeOtherSessions`
      de `src/lib/domain/security.ts`.
- [x] **G.15** Eliminar `revokeSession`/`revokeOtherSessions` del resolver
      `securityResolvers.Mutation` en `src/graphql/resolvers/security.ts`.
- [x] **G.16** Eliminar `src/graphql/operations/security/revoke-session.graphql`
      y `revoke-other-sessions.graphql`.

**Commit sugerido:** `refactor(security): eliminar subsección de sesiones activas`

### Fase H — Limpieza y verificación (bloqueante al cierre) ✅ CERRADA

> **Estado:** ✅ Cerrada el 2026-11-06. `scripts/test-backend.ts` no
> existe. Cero residuos de `RestBackendNotConfiguredError` /
> `RestBackendUnavailableError`. Claves i18n huérfanas limpiadas.
> Placeholders `<hash_B4>` y `<hash_B5>` resueltos con los hashes
> reales `07cc902` y `bdee485`. README ya documentaba el setup.
> Validaciones: `type-check` 0, `lint` 0, `mock:test` 54/54,
> `domain:test` 6/6, `graphql:validate` válido.

- [x] **H.1** Eliminar `scripts/test-backend.ts`.
  - **Estado:** ✅ Ya eliminado en C.0.
- [x] **H.2** Verificar que `scripts/test-mock.ts` sigue pasando 59/59.
  - **Estado:** ✅ 54/54 (bajó 5 por los tests de sesiones eliminados
    en Fase G).
- [x] **H.3** Eliminar `RestBackendNotConfiguredError`,
      `RestBackendUnavailableError`, `RestBackendResponse` donde queden
      referencias.
  - **Estado:** ✅ Cero residuos. `RestBackendResponse<T>` se conserva
    en `client.ts` porque `MockPublicBackendClient` lo usa.
- [x] **H.4** `pnpm type-check`, `pnpm lint`, `pnpm mock:test`,
      `pnpm graphql:validate` en verde.
  - **Estado:** ✅ Los 4 en verde.
- [x] **H.5** Actualizar `README.md` con el nuevo setup (Prisma, `pnpm prisma migrate dev`, `pnpm prisma db seed`, `BACKEND_MODE=local|mock`).
  - **Estado:** ✅ Ya documentado desde Fase B. Sin cambios.

- [x] **H.6 (nueva)** Limpiar claves i18n huérfanas:
      `auth.login.form.errors.unavailable` eliminada; `unexpected`
      conservada; `unavailable` de registro y recuperación conservadas
      (sus formularios aún las usan). Ajustar
      `src/app/[locale]/(web)/(site)/(auth)/login/page.tsx` para dejar
      de pedir la clave eliminada.
  - **Estado:** ✅ Cerrada.

**Commit sugerido:** `chore(monolith): eliminar residuos del backend externo y actualizar setup`

### Fase I — Actualizar `user-settings-plan.md` (diferible) ✅ CERRADA

> **Estado:** ✅ Cerrada el 2026-11-07. `docs/user-settings-plan.md`
> referencia el plan de migración en su cabecera y en la bitácora (§9).
> Ambos documentos quedan sincronizados. Con esta fase, el plan de
> migración a monolito queda completo (A–I cerradas).

- [x] **I.1** Añadir una nota al inicio de `docs/user-settings-plan.md`
      indicando que el plan sigue vigente para las fases 0–5, pero que la
      arquitectura de backend cambió y este documento es la fuente de
      verdad del cambio.
- [x] **I.2** Añadir una entrada a la bitácora (§9 de
      `user-settings-plan.md`) con fecha y referencia a este documento.

**Commit aplicado:** `4d7e6ae` (`docs(user-settings): referenciar plan de migración a monolito`).

---

## 5. Bitácora

| Fecha      | Fase                                             | Estado      | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —          | Plan creado                                      | Borrador    | Decisiones D-1 a D-10 cerradas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| —          | Decisiones D-4.1, D-4.2, D-7, D-8, D-9.1         | Cerradas    | `session.user={id,role}`, sin `error`; `sessions` eliminado (B); `bcryptjs`; Docker Compose. Listo para Fase A.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| —          | Limpieza del borrador                            | Cerrada     | Corregido naming `services/`→`src/lib/domain/`, Fase A.1, Fase B.2 (sin `Session`), Fase G (solo D-7 = B), Fase H (H.1, H.3 duplicada), Fase D (IDs).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-01 | **Fase A — Decisiones y documentación**          | **Cerrada** | 10 commits (`93281b3` … `fa4fbbe`). Contrato alineado a v2.0: `arquitectura.md`, `autenticacion.md`, `README.md` (31 métodos), `historial-cambios.md`, `.env.example`, `password.md`. D-11 = C-1 (`LocalBackendClient` con `userId`), D-12 = eliminar `services/auth.ts`. Siguiente: Fase B (Prisma).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-01 | **Fase B.0 — Dependencias**                      | **Cerrada** | `prisma@6.19.3`, `@prisma/client@6.19.3`, `bcryptjs@3.0.3`. `@types/bcryptjs` descartado (bundled en v3). `pnpm-workspace.yaml` aprueba builds de `prisma` y `@prisma/engines`. `package-lock.json` eliminado. Siguiente: B.1 (Docker Compose).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-01 | **Fase B.1 — Docker + entorno**                  | **Cerrada** | `docker-compose.yml` con `postgres:16` (volumen nombrado, healthcheck). `.env` consolidado (renombrado desde `.env.local`: Prisma CLI lee `.env`, no `.env.local`). `README.md` reescrito. Commit `667afe7`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-01 | **Fase B.2 — Schema Prisma**                     | **Cerrada** | `prisma/schema.prisma` con 14 modelos + 9 enums. Scripts de Prisma en `package.json`. Bloque `"prisma": { "seed": "tsx prisma/seed.ts" }`. Commits `bcdc76f`, `9a5af2a`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-03 | **Fase B.3 — Migración inicial**                 | **Cerrada** | Migración `20261104015947_init` aplicada. 14 tablas + `_prisma_migrations` (15 en `\dt`), 9 enums en `\dT+`, FKs, uniques e índices verificados. Commit `c933b2c`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-03 | **Fase B.4 — Seed**                              | **Cerrada** | `prisma/seed.ts` con 3 usuarios (`student@example.com`, `teacher@example.com`, `admin@example.com`, password `ValidPass1!`), idempotente vía `upsert` por PK. Student con datos ricos (subscription, payment method, invoice, certificate, enrollment). D-B4.1 (crudo con PrismaClient), D-B4.2 (3 usuarios), D-B4.3 (import directo), D-B4.4 (`TODO(seed-shared-prisma)` diferido). Commit `07cc9027d893841db00d4608897153400b466705` (sin push).                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-05 | **Fase B.5 — Singleton PrismaClient**            | **Cerrada** | `src/lib/db/prisma.ts` con patrón `globalThis.prisma`, `import 'server-only'` (D-B5.1), `logLevels` variable por `NODE_ENV` (D-B5.3), `server-only@0.0.1` añadido a `dependencies`. Smoke test directo `SELECT 1` validado (`[ { ok: 1 } ]`). Commit `bdee485d1ae51c7461cf7b8ef784dbf683d23142` (sin push).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-05 | **Fase B — COMPLETA**                            | **Cerrada** | B.0 a B.5 cerradas. Prisma + PostgreSQL operativos. Siguiente: **C.0 (auditoría de tipos `Backend*` vs. contrato v2.0)** antes de arrancar C.1. Decisión registrada: **no se migra a Prisma 7 ni a `prisma.config.ts`** (ver §6 deuda de Prisma 8 RC en `Rol y propósito.txt`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-05 | **Fase C.0 — Auditoría de tipos `Backend*`**     | **Cerrada** | Eliminados `BackendTokenPair`, `BackendTokenPairResponse`, `BackendDataResponse<T>` y `BackendLoginResponse`. `BackendLoginData` reducido a `{ id, role, token, refreshToken, expiresIn, refreshExpiresIn }`. Ajustados `PublicBackendClient`, `RestBackendClient`, `MockBackendClient`, `services/auth.ts` (con `AuthTokenPair` local) con tipos inline. Diferida la eliminación de `BackendSecuritySession`/`sessions` a Fase G (`TODO(phase-g)`). Adelantada la eliminación de `scripts/test-backend.ts` y del script `"backend:test"`. Validaciones en verde (type-check 0, lint 0, mock:test 59/59). Commit `6ed6070` (sin push).                                                                                                                                                                                                                                    |
| 2026-11-05 | **Fase C.1.a — Dominio básico**                  | **Cerrada** | 8 archivos creados en `src/lib/domain/` (`users`, `personal-data`, `privacy`, `preferences`, `account`, `courses`, `certificates`, `billing`). Sin imports cruzados. `getPublicProfile` aplica matriz de visibilidad (§8.2.18) y devuelve `null`. `updateProfile` con PATCH anidado de `bio` y `Prisma.DbNull` para borrar la bio completa. `updatePersonalData` con `identityLocked` atómico (403) y rechazo de `null` en nombres (422). `updatePrivacy` y `updatePreferences` rechazan `null` (422). Fechas ISO 8601. Sin validación de roles (eso vive en BFF + C.2). Validaciones: type-check 0, lint 0, mock:test 59/59. Commit `727dcfa` (sin push).                                                                                                                                                                                                                |
| 2026-11-05 | **Fase C.1.b — Dominio complejo**                | **Cerrada** | 4 archivos creados en `src/lib/domain/` (`auth`, `security`, `subscription`, `contact`) + `scripts/test-domain.ts` + script `domain:test`. `registerUser` con `$transaction` atómica (7 inserciones), `P2002` → `409 CONFLICT`. Reset de contraseña con tokens SHA-256, TTL 1h, doble validación dentro del `tx`. `changePassword` sin revocar otras sesiones (no hay modelo `Session`). 2FA simulado sin email (`TODO(two-factor-code-validation)`). Stubs `revokeSession`/`revokeOtherSessions` (404). `changePlan` upgrade inmediato, downgrade a fin de período, `PAYMENT_METHOD_REQUIRED`, `enterprise` prohibido. `cancelSubscription` solo `cancelAtPeriodEnd`. `contact` stub (`console.info`). Deuda anotada: `pendingSetups` in-memory, persistir en Fase E. Validaciones: type-check 0, lint 0, mock:test 59/59, domain:test 5/5. Commit `8e278b4` (sin push). |
| 2026-11-05 | **Fase C.1.c — removePaymentMethod**             | **Cerrada** | Sub-fase pequeña descubierta al auditar C.2. `billing.ts` con `removePaymentMethod` (404 si no existe, 409 si es el último método de premium `active`, contrato §7). `LocalBackendClient` delega al dominio. 6º test de dominio. Validaciones: type-check 0, lint 0, mock:test 59/59, domain:test 6/6. Commit `2669c10` (sin push).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-05 | **Fase C.3+C.4+C.7 — Limpieza de backend**       | **Cerrada** | `createBackendClient(userId?: string)` devuelve `LocalBackendClient` en modo local y `MockBackendClient` en mock. `createPublicBackendClient()` lanza `Error` en local hasta C.6. `src/app/api/graphql/route.ts` usa `session?.user?.id` y elimina `getToken`. Elimina `src/lib/backend/rest/client.ts` y sus re-exports. `routeErrors.ts` simplificado (sin `RestBackendNotConfiguredError`). Excepción mínima en `services/call.ts` (`callBackend` como alias de `fn()` con `TODO(phase-c6)`). C.5 diferida hasta después de C.6: `http.ts` sigue siendo consumido por `services/*`. Validaciones: type-check 0, lint 0, mock:test 59/59, domain:test 6/6. Commit `dd6d4d4` (sin push).                                                                                                                                                                                 |
| 2026-11-06 | **Fase C.2 — LocalBackendClient (bookkeeping)**  | **Cerrada** | C.2 estaba funcionalmente completa desde C.3 pero no tachada en el plan. `LocalBackendClient` implementa los 12 grupos de métodos de `BackendClient`, recibe `userId` en el constructor (D-11 = C-1) y filtra por `this.userId`. `createBackendClient(userId)` en `index.ts` lo instancia en modo local. Verificado con `grep` + `tsc --noEmit`. Sin commit propio (el código ya estaba en C.3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-06 | **Fase C.6 + C.6.1 — Route handlers al dominio** | **Cerrada** | 5 route handlers del sitio público llaman directamente a `src/lib/domain/*` con traducción inline de `BackendOperationError`. Eliminados `services/{auth,contact,call}.ts` y `http.ts`. `RestBackendResponse<T>` movido a `client.ts`. Conservados `PublicBackendClient`/`MockPublicBackendClient`/`createPublicBackendClient` para no romper `src/auth.ts` (Fase D). 11 archivos tocados (7 M + 4 D). Validaciones: type-check 0, lint 0, mock:test 59/59, domain:test 6/6 (requirió PostgreSQL activo). Commit `30c42f0` (sin push).                                                                                                                                                                                                                                                                                                                                    |
| 2026-11-06 | **Fase C — COMPLETA**                            | **Cerrada** | C.0 a C.7 cerradas, incluida C.6.1 (desbloqueo de infraestructura). `src/lib/backend/services/` y `src/lib/backend/http.ts` ya no existen. Los 5 route handlers del sitio público llaman al dominio. `RestBackendResponse<T>` vive en `client.ts`. Siguiente: **Fase D (Auth.js puro)** — reescribir `src/auth.ts`, mover `authenticateUser` al dominio, eliminar `PublicBackendClient`/`MockPublicBackendClient`/`createPublicBackendClient` cuando `src/auth.ts` deje de usarlos.                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-06 | **Fase D — Auth.js puro**                        | **Cerrada** | `authenticateUser(email, password)` en `src/lib/domain/auth.ts` (bcrypt + `select: { id, role, passwordHash }`). `src/auth.ts` reescrito (143 líneas, era 394): `authorize()` → `authenticateUser`, callbacks `{ id, role }`, sin `events.signOut`, sin `UnavailableError`, sin `TokenPairSchema`/`refreshAccessToken`/`refreshInFlight`/`isLoginSuccessResponse`. `next-auth.d.ts` sin `Session.error` ni tokens. `client.ts` sin `PublicBackendClient`. `index.ts` sin `createPublicBackendClient`. `MockPublicBackendClient` sin `implements` (conserva contrato para `mock:test`). `LoginForm.tsx` sin `unavailable`. 7 archivos, +62/-404. Validaciones: type-check 0, lint 0, mock:test 59/59, domain:test 6/6. Commit `fb1e2e5` (sin push).                                                                                                                        |
| 2026-11-06 | **Fase D — COMPLETA**                            | **Cerrada** | D.1, D.2, D.3, D.4 y D.5 (nueva) cerradas. Auth.js puro con JWT firmado propio. Sin access/refresh tokens externos. `authenticateUser` vive en el dominio. `PublicBackendClient` y `createPublicBackendClient` eliminados. Siguiente: **F + G + H** (mecánicas). Fase I diferible. Deuda diferida a H: claves i18n huérfanas, `07cc9027d893841db00d4608897153400b466705`, `bdee485d1ae51c7461cf7b8ef784dbf683d23142` en bitácora.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-06 | **Fase F — Verificación de resolvers**           | **Cerrada** | Los 9 resolvers restantes intactos (`account`, `billing`, `certificates`, `courses`, `personal-data`, `preferences`, `privacy`, `profile`, `user`). `security.ts` se ajustó en G.15. `route.ts` y `auth.ts` verificados sin cambios. Sin archivos modificados. Commit `240652f` (sin push).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-06 | **Fase G — Eliminar sesiones de Security**       | **Cerrada** | `Session`, `sessions`, `revokeSession` y `revokeOtherSessions` eliminados del schema, operation, resolver, mock, tipos, cliente local y dominio. `SessionsSection.tsx` borrado. `SecurityOverviewClient.tsx` sin `<SessionsSection />` ni contador. Mensajes i18n limpios en es/en. `mock:test` 59→54 (-5 tests). `graphql:validate` verde. 15 archivos M + 3 D. Commit `240652f` (sin push).                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-06 | **Fase H — Limpieza y verificación**             | **Cerrada** | `scripts/test-backend.ts` ya eliminado en C.0. Cero residuos `RestBackend*`. Claves i18n huérfanas limpiadas (`auth.login.form.errors.unavailable`; `login/page.tsx` ajustado). Placeholders `<hash_B4>` / `<hash_B5>` resueltos con `07cc902` y `bdee485`. README ya documentado. `mock:test` 54/54, `domain:test` 6/6, `graphql:validate` verde, `type-check` 0, `lint` 0. Commits: `240652f` (código) + `27354f9` (plan).                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-07 | **Fase I — Cierre del plan**                     | **Cerrada** | `docs/user-settings-plan.md` referencia el plan de migración en su cabecera (nota de migración) y en la bitácora (§9). Ambos documentos quedan sincronizados. Commit `4d7e6ae` (`docs(user-settings): referenciar plan de migración a monolito`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-07 | **Fases A–I — PLAN COMPLETO**                    | **Cerrada** | Migración arquitectónica cerrada. Backend externo eliminado. Monolito Next.js 16 + Prisma + PostgreSQL + Auth.js puro + BFF GraphQL + capa de dominio. `src/lib/backend/services/*` y `src/lib/backend/http.ts` ya no existen. `session.user = { id, role }`. `security.sessions` eliminado (D-7 = B). `mock:test` 54/54, `domain:test` 6/6, `graphql:validate` verde. `type-check` 0, `lint` 0. Commits clave: `30c42f0` (C.6+C.6.1), `fb1e2e5` (D), `240652f` (F+G+H), `27354f9` (plan F+G+H), `4d7e6ae` (Fase I).                                                                                                                                                                                                                                                                                                                                                      |

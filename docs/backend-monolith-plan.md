# Plan de implementación: migración a monolito con Auth.js puro

> Documento vivo. Se actualiza conforme avanza el trabajo.  
> Fuente de verdad para la migración arquitectónica del proyecto.
>
> **Estado:** decisiones cerradas. Plan listo para arrancar por Fase A.
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

| #     | Decisión                                    | Valor                                                           | Notas                                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1   | ORM + DB                                    | **Prisma + PostgreSQL**                                         | DB nueva, sin migración de datos                                                                                                                                                                                                                                                                           |
| D-2   | Indirección `services/`                     | **Conservar** la interfaz `BackendClient`                       | Los resolvers GraphQL no cambian                                                                                                                                                                                                                                                                           |
| D-3   | Modo `mock`                                 | **Modo de ejecución** (`BACKEND_MODE=mock`)                     | `pnpm dev` sin DB funciona                                                                                                                                                                                                                                                                                 |
| D-4   | Auth                                        | **Auth.js puro** (sin access/refresh externos)                  |                                                                                                                                                                                                                                                                                                            |
| D-4.1 | `session.user`                              | **`{ id, role }`**                                              | Se elimina `error` y los tokens del JWT                                                                                                                                                                                                                                                                    |
| D-4.2 | `RefreshTokenExpired` / `RefreshTokenError` | **Eliminados**                                                  | Auth.js redirige solo                                                                                                                                                                                                                                                                                      |
| D-5   | Contrato `docs/backend-api/`                | **Contrato interno de métodos**                                 | Se conserva el contenido, cambia el marco                                                                                                                                                                                                                                                                  |
| D-6   | Route handlers                              | **Conservar**, llaman a funciones de dominio                    | No se migran a Server Actions                                                                                                                                                                                                                                                                              |
| D-7   | `mySecuritySettings.sessions`               | **B — eliminar**                                                | Se borra `SessionsSection.tsx` y se actualiza el contrato                                                                                                                                                                                                                                                  |
| D-8   | Hash de contraseñas                         | **`bcryptjs`**                                                  | Sin binarios, portable                                                                                                                                                                                                                                                                                     |
| D-9   | Migración de datos                          | **No** (proyecto académico)                                     | Arranca con DB vacía + seed                                                                                                                                                                                                                                                                                |
| D-9.1 | PostgreSQL                                  | **Docker Compose** (`postgres:16`) en local; **mock en Vercel** | `DATABASE_URL` en `.env.local` para desarrollo. En Vercel, la demo corre con `BACKEND_MODE=mock` y no se conecta a PostgreSQL (trabajo académico, sin costos). Docker Compose no se usa en producción.                                                                                                     |
| D-10  | Alcance del mock                            | **A corto plazo: reimplementa** (como hoy)                      | B (compartir lógica) queda como mejora futura                                                                                                                                                                                                                                                              |
| D-11  | Firma de `LocalBackendClient`               | **C-1: recibe `userId` en el constructor**                      | Respeta D-2 (resolvers no cambian). El `context()` de Yoga obtiene `session.user.id` vía `auth()` y lo pasa al cliente. Cada método del cliente filtra por `this.userId`. Si en el futuro se necesita multi-tenant o service accounts, se refactoriza a C-2 (userId como primer argumento de cada método). |
| D-12  | `src/lib/backend/services/auth.ts`          | **Eliminar en Fase C.6**                                        | Los route handlers de Fase E y `authorize()` de Fase D llaman directamente a `src/lib/domain/auth.ts`. Una capa menos de indirección, menos superficie de error. `loginWithPassword` se renombra/mueve a `authenticateUser` dentro del dominio.                                                            |

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

### Fase B — Capa de datos (bloqueante)

- [ ] **B.1** Añadir `prisma` + `@prisma/client` a `package.json`.
- [ ] **B.2** Crear `prisma/schema.prisma` con los modelos del contrato
      interno:
  - `User` (id, email, passwordHash, role, image, bio, interests, createdAt)
  - `PersonalData` (userId, firstName, lastName, documentType, documentId,
    phone, country, address, identityLocked)
  - `PrivacySettings` (userId, profileVisibility, emailVisibility,
    phoneVisibility, allowDirectMessages)
  - `Preferences` (userId, language, theme, timezone, notifications JSON,
    accessibility JSON)
  - `SecuritySettings` (userId, emailVerified, twoFactorEnabled,
    twoFactorRequired, twoFactorSecret)
  - _(no se crea modelo `Session`: D-7 = B elimina `sessions` del contrato)_
  - `Account` (userId, status, deactivationScheduledAt)
  - `Subscription` (id, userId, plan, status, startedAt, currentPeriodEnd,
    cancelAtPeriodEnd)
  - `PaymentMethod` (id, userId, brand, last4, expirationMonth,
    expirationYear)
  - `Invoice` (id, userId, number, amount, currency, status, issuedAt,
    downloadUrl)
  - `Certificate` (id, userId, courseId, courseTitle, certificateNumber,
    issuedAt, downloadUrl)
  - `CourseEnrollment` (id, userId, courseId, title, progress, status,
    enrolledAt, completedAt)
  - `PasswordResetToken` (token, userId, expiresAt, usedAt)
  - `EmailChangeToken` (token, userId, newEmail, expiresAt, usedAt)
- [ ] **B.3** Crear `prisma/seed.ts` con un usuario de desarrollo
      (`test@example.com` / `ValidPass1!`) y datos fixture (una suscripción
      `free`, un método de pago, una factura, un certificado, un curso,
      `PersonalData` completo, `SecuritySettings` sin 2FA).
- [ ] **B.4** `pnpm prisma migrate dev --name init` y commitear la migración.
- [ ] **B.5** Crear `src/lib/db/prisma.ts` (singleton de `PrismaClient` para
      Next.js, con `globalThis` para HMR).

**Commit sugerido:** `feat(db): introducir Prisma y schema inicial`

### Fase C — Capa de dominio (bloqueante)

- [ ] **C.1** Crear `src/lib/domain/*` con funciones de negocio, una por
      método de `BackendClient`:
  - `auth.ts`: `authenticateUser(email, password)`, `registerUser(input)`,
    `requestPasswordReset(email)`, `validateResetToken(token)`,
    `resetPassword(token, newPassword)`.
  - `users.ts`: `getUser(id)`, `getPublicProfile(id)`, `updateProfile(id, input)`.
  - `personal-data.ts`: `getPersonalData(id)`, `updatePersonalData(id, input)`
    (con regla `identityLocked`).
  - `privacy.ts`, `preferences.ts`, `security.ts`, `account.ts`,
    `courses.ts`, `certificates.ts`, `subscription.ts`, `billing.ts`.
  - `contact.ts`: `submitContact(input)`.
- [ ] **C.2** Crear `src/lib/backend/local/client.ts` con `LocalBackendClient`
      que implementa `BackendClient` llamando a `src/lib/domain/*`.
- [ ] **C.3** Reescribir `src/lib/backend/index.ts`:
  - `createBackendClient()` sin `accessToken` (Auth.js puro).
  - `createPublicBackendClient()` sigue existiendo para los route handlers
    (que ahora llaman a `LocalBackendClient.auth.*`).
- [ ] **C.4** Eliminar `src/lib/backend/rest/client.ts`.
- [ ] **C.5** Eliminar `src/lib/backend/http.ts` (o reducirlo a
      `BackendOperationError` si se sigue usando; verificar).
- [ ] **C.6** Reescribir `src/lib/backend/services/*` como wrappers finos
      sobre `src/lib/domain/*` (o eliminarlos si `LocalBackendClient` ya
      los reemplaza; decidir en el momento).
- [ ] **C.7** `src/lib/backend/routeErrors.ts`: `backendRouteError()` ya no
      maneja `RestBackendNotConfiguredError`. Se simplifica.

**Commit sugerido:** `feat(domain): implementar lógica de negocio en Prisma`

### Fase D — Autenticación (bloqueante, depende de D-4.1 y D-4.2)

- [ ] **D.1** Reescribir `src/auth.ts`:
  - `authorize()` llama a `authenticateUser(email, password)`.
  - Devuelve `{ id, role }`.
  - Se elimina `TokenPairSchema`, `refreshAccessToken`, `refreshInFlight`,
    `LoginSuccessResponse`, `UnavailableError`, `events.signOut` (o se
    reduce a log).
  - `callbacks.jwt` solo copia `id` y `role` en el primer login.
  - `callbacks.session` copia `id` y `role` (sin `error`).
- [ ] **D.2** Reescribir `src/types/next-auth.d.ts`:
  - `Session.user = { id, role }`.
  - Eliminar `Session.error`.
  - Eliminar tokens de `User` y `JWT`.
- [ ] **D.3** Verificar `src/proxy.ts` (no debería cambiar; solo usa
      `req.auth`).
- [ ] **D.4** Verificar `LoginForm.tsx` (sigue manejando `code` de
      `CredentialsSignin`; `RateLimitedError` se conserva, `UnavailableError`
      se elimina o se reduce a `invalidCredentials`).

**Commit sugerido:** `refactor(auth): simplificar a Auth.js puro sin refresh externo`

### Fase E — Route handlers (diferible)

- [ ] **E.1** Reescribir `src/app/api/auth/register/route.ts` para llamar
      a `registerUser()` directamente (o a `createPublicBackendClient().auth.register()`,
      que ahora resuelve al `LocalBackendClient`).
- [ ] **E.2** Idem `forgot-password`, `reset-password`,
      `validate-reset-token`, `contact`.
- [ ] **E.3** Verificar que `backendRouteError()` sigue traduciendo
      `BackendOperationError` correctamente.

**Commit sugerido:** `refactor(routes): route handlers llaman a dominio local`

### Fase F — Resolvers GraphQL y BFF (diferible)

- [ ] **F.1** Verificar que los 10 resolvers no cambian (si D-2 = A).
- [ ] **F.2** Ajustar `src/app/api/graphql/route.ts`:
  - Contexto: `createBackendClient()` sin `accessToken`.
  - `backendOperationErrorPlugin`: sigue mapeando `BackendOperationError`.
- [ ] **F.3** Verificar `requireAuth` / `requireRole` (no cambian).

**Commit sugerido:** `refactor(bff): contexto GraphQL sin access token externo`

### Fase G — Security: eliminar subsección de sesiones (diferible, D-7 = B)

- [ ] **G.1** Actualizar `src/graphql/schema/settings/security.graphql`:
      eliminar `sessions` del tipo `SecuritySettings` y el tipo `Session`.
- [ ] **G.2** Actualizar `src/graphql/operations/security/my-security-settings.graphql`
      (eliminar el bloque `sessions { ... }`).
- [ ] **G.3** Regenerar `src/graphql/generated/graphql.ts` con
      `pnpm graphql:codegen`.
- [ ] **G.4** Borrar `src/app/[locale]/(web)/dashboard/user-settings/SessionsSection.tsx`.
- [ ] **G.5** Actualizar `SecurityOverviewClient.tsx`: eliminar
      `<SessionsSection />`, el contador de sesiones del `overview` y los
      mensajes `sessions` de `SecurityOverviewMessages`.
- [ ] **G.6** Actualizar `src/messages/{es,en}.json`: eliminar
      `dashboard.userSettings.security.sessions.*` y las claves de
      `overview` de sesiones.
- [ ] **G.7** Actualizar `src/lib/mock/client.ts`: eliminar `sessions` de
      `security.getMe`, `revokeSession`, `revokeOtherSessions`, y el
      `MockOperation` correspondiente.
- [ ] **G.8** Actualizar `scripts/test-mock.ts`: eliminar los tests
      `revokeSession`, `revokeOtherSessions`, `revokeSession rejects current
session`, `revokeSession accepts a non-current session` y
      `changePassword closes other sessions`.
- [ ] **G.9** Actualizar `docs/backend-api/_rutas/users-me/security/password.md`:
      eliminar la mención "el backend revoca todas las sesiones excepto la
      actual" (ya no aplica).
- [ ] **G.10** Actualizar `docs/user-settings-plan.md` §5.3 (Security):
      marcar `sessions` como eliminado con referencia a este plan.

**Commit sugerido:** `refactor(security): eliminar subsección de sesiones activas`

### Fase H — Limpieza y verificación (bloqueante al cierre)

- [ ] **H.1** Eliminar `scripts/test-backend.ts`.
- [ ] **H.2** Verificar que `scripts/test-mock.ts` sigue pasando 59/59.
- [ ] **H.3** Eliminar `RestBackendNotConfiguredError`,
      `RestBackendUnavailableError`, `RestBackendResponse` donde queden
      referencias.
- [ ] **H.4** `pnpm type-check`, `pnpm lint`, `pnpm mock:test`,
      `pnpm graphql:validate` en verde.
- [ ] **H.5** Actualizar `README.md` con el nuevo setup (Prisma, `pnpm prisma migrate dev`, `pnpm prisma db seed`, `BACKEND_MODE=local|mock`).

**Commit sugerido:** `chore(monolith): eliminar residuos del backend externo y actualizar setup`

### Fase I — Actualizar `user-settings-plan.md` (diferible)

- [ ] **I.1** Añadir una nota al inicio de `docs/user-settings-plan.md`
      indicando que el plan sigue vigente para las fases 0–5, pero que la
      arquitectura de backend cambió y este documento es la fuente de
      verdad del cambio.
- [ ] **I.2** Añadir una entrada a la bitácora (§9 de
      `user-settings-plan.md`) con fecha y referencia a este documento.

**Commit sugerido:** `docs(user-settings): referenciar plan de migración a monolito`

---

## 5. Bitácora

| Fecha      | Fase                                     | Estado      | Notas                                                                                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —          | Plan creado                              | Borrador    | Decisiones D-1 a D-10 cerradas.                                                                                                                                                                                                                                                                       |
| —          | Decisiones D-4.1, D-4.2, D-7, D-8, D-9.1 | Cerradas    | `session.user={id,role}`, sin `error`; `sessions` eliminado (B); `bcryptjs`; Docker Compose. Listo para Fase A.                                                                                                                                                                                       |
| —          | Limpieza del borrador                    | Cerrada     | Corregido naming `services/`→`src/lib/domain/`, Fase A.1, Fase B.2 (sin `Session`), Fase G (solo D-7 = B), Fase H (H.1, H.3 duplicada), Fase D (IDs).                                                                                                                                                 |
| 2026-11-01 | **Fase A — Decisiones y documentación**  | **Cerrada** | 10 commits (`93281b3` … `fa4fbbe`). Contrato alineado a v2.0: `arquitectura.md`, `autenticacion.md`, `README.md` (31 métodos), `historial-cambios.md`, `.env.example`, `password.md`. D-11 = C-1 (`LocalBackendClient` con `userId`), D-12 = eliminar `services/auth.ts`. Siguiente: Fase B (Prisma). |

---
kind: convention
source_legacy: '§1, §1.1, §12'
contract_version: v2.0
---

# Arquitectura

StudySync es un **monolito Next.js** con BFF GraphQL integrado y persistencia
propia (Prisma + PostgreSQL). No existe backend externo ni `API_BASE_URL`.

El contrato `docs/backend-api/` sigue siendo la **fuente de verdad única** de
las operaciones del dominio, pero ahora describe **métodos internos** del
servicio, no endpoints REST entre servicios (ver D-5 en
`docs/backend-monolith-plan.md`).

---

## Cómo funciona

### Dashboard (autenticado)

```text
React (Server + Client Components)
      │ GraphQL
      ▼
BFF GraphQL (/api/graphql)
      │ c.backend.*  (interfaz BackendClient)
      ▼
Capa de dominio (src/lib/domain/)
      │ Prisma
      ▼
PostgreSQL (o Mock en memoria si BACKEND_MODE=mock)
```

### Sitio público (login, registro, recuperación, contacto)

```text
React
      │ fetch
      ▼
Route Handlers de Next.js (/api/auth/*, /api/contact)
      │ llaman directamente a la capa de dominio
      ▼
Capa de dominio (src/lib/domain/)
      │ Prisma
      ▼
PostgreSQL (o Mock en memoria si BACKEND_MODE=mock)
```

El login por credenciales lo consume Auth.js dentro de `authorize()`, que
también llama a la capa de dominio. Auth.js firma un JWT propio; no hay
access token ni refresh token externos (ver D-4).

### Modo mock

`BACKEND_MODE=mock` sustituye la capa de datos por un mock en memoria. Las
operaciones expuestas, los tipos, los códigos HTTP y los `error.code` son
idénticos. `pnpm dev` funciona sin base de datos.

---

## Modos de operación

El contrato v2.0 puede implementarse en dos modos:

| Modo    | Cuándo se usa                                                      | Fuente de datos                         |
| ------- | ------------------------------------------------------------------ | --------------------------------------- |
| `local` | Entorno real (default). Monolito con Prisma + PostgreSQL.          | Base de datos PostgreSQL.               |
| `mock`  | Entorno controlado (desarrollo, pruebas, demos) sin base de datos. | Implementación en memoria del contrato. |

El modo se selecciona con `BACKEND_MODE`, no mediante cambios en el contrato ni
en los resolvers GraphQL.

### Regla de equivalencia

Ambos modos implementan el mismo contrato:

- Las operaciones expuestas por el cliente son idénticas.
- Los tipos de entrada y salida son idénticos.
- Los códigos HTTP y los `error.code` son idénticos.
- Los resolvers GraphQL y los route handlers no distinguen el modo.

### Alcance del modo mock

El modo mock cubre las operaciones que el frontend/BFF consume a través del
cliente del contrato (ver [`README.md`](../README.md#relación-con-el-frontend),
"Relación con el frontend").

Las rutas de autenticación pública y contacto (`/auth/*` y `/contact`) son
consumidas por Auth.js y los route handlers de Next.js. Si se requiere operar
esas rutas sin base de datos, deben cubrirse mediante un cliente equivalente,
no extendiendo el cliente del dashboard.

### Garantías del modo mock

- No realiza peticiones de red.
- Devuelve datos deterministas y válidos según este contrato.
- Respeta los formatos definidos en [`reglas-transversales.md`](reglas-transversales.md).
- Puede simular los errores definidos en [`errores.md`](errores.md) y en cada
  archivo de método.

### Regla de validez

Ningún modo puede alterar el contrato. Cualquier diferencia entre modos se
considera un defecto de implementación, no una variación del contrato.

---

## Qué hace cada capa

### React (dashboard y sitio público)

Server Components orquestan la página y traen traducciones y sesión. Client
Components manejan formularios, mutaciones y estado local.

El dashboard habla solo con GraphQL (`/api/graphql`). El sitio público
habla solo con route handlers (`/api/auth/*`, `/api/contact`). Ningún
componente llama directamente a Prisma ni a la capa de dominio.

### BFF GraphQL

El BFF:

- expone el contrato GraphQL;
- valida autenticación cuando corresponde (`requireAuth`, `requireRole`);
- utiliza la interfaz `BackendClient` vía `c.backend.*`;
- no acopla los resolvers a Prisma ni a la capa de dominio;
- interpreta los errores del dominio mediante `error.code`;
- transforma errores de dominio a errores GraphQL;
- puede convertir comportamientos específicos como 404 de perfil público a
  `null`, según el contrato GraphQL;
- no debe depender de que exista PostgreSQL para arrancar, renderizar o
  resolver operaciones cubiertas por el modo mock.

### Route handlers

Los route handlers de Next.js (`/api/auth/*`, `/api/contact`) validan con Zod
en el borde, llaman a la capa de dominio y traducen errores de dominio a la
forma estable de respuesta (`{ status, code, ... }`). Aplican rate limiting.

Auth.js vive en `/api/auth/[...nextauth]/route.ts` y, dentro de `authorize()`,
llama a la capa de dominio para autenticar. No hay tokens externos: Auth.js
firma un JWT propio con `{ id, role }` (ver
[`autenticacion.md`](autenticacion.md)).

### Capa de dominio (`src/lib/domain/`)

La capa de dominio es responsable de:

- autenticación y autorización de negocio;
- validación de reglas cruzadas (semántica PATCH, `identityLocked`,
  transiciones de suscripción, `SESSION_IS_CURRENT`, etc.);
- reglas de rol que no son solo "hay sesión" (`disableTwoFactor` solo para
  `student`, `deactivation` solo para `student`, etc.);
- consistencia de datos;
- integraciones externas (envío de correos, URLs firmadas);
- seguridad de negocio.

La autorización por rol se refuerza en dos capas:

- BFF (`requireRole` en `src/graphql/auth.ts`): bloquea con 403 antes de
  llamar a la capa de dominio.
- Dominio: vuelve a validar como defensa en profundidad.

Aunque BFF y dominio corren en el mismo proceso, esta doble validación es
intencional: aísla los resolvers de GraphQL de cambios futuros en la capa de
dominio, y evita que un refactor accidental elimine la validación en un solo
punto.

### Capa de datos (Prisma + PostgreSQL)

Prisma es el único punto de acceso a PostgreSQL. La capa de dominio no ejecuta
SQL crudo; usa los modelos de Prisma (`User`, `PersonalData`, `PrivacySettings`,
`Preferences`, `SecuritySettings`, `Account`, `Subscription`, `PaymentMethod`,
`Invoice`, `Certificate`, `CourseEnrollment`, `PasswordResetToken`,
`EmailChangeToken`).

**No existe modelo `Session`** (ver D-7 = B en
`docs/backend-monolith-plan.md`): la sesión la gestiona Auth.js con su JWT
firmado, y el contrato ya no expone `sessions` en `mySecuritySettings`.

### Modo mock (recordatorio)

`MockBackendClient` y `MockPublicBackendClient` implementan la misma interfaz
que `LocalBackendClient` y `MockPublicBackendClient`. Viven en
`src/lib/mock/client.ts` y mantienen su estado en `globalThis.__mockStore` para
sobrevivir entre requests del mismo proceso. Las garantías y el alcance son los
descritos arriba.

---

## Versionado del contrato

El contrato interno está versionado en
[`_historico/historial-cambios.md`](../_historico/historial-cambios.md).

- La versión actual es v2.0.
- Los cambios incompatibles generan una nueva versión.
- Los cambios que no afectan a la forma de los métodos ni a los `error.code`
  se consideran compatibles y se anotan como parche (`v2.0.x`) o como parte de
  la siguiente versión menor.

---

## Relación con el plan de migración

`docs/backend-monolith-plan.md` documenta las decisiones arquitectónicas
(D-1 a D-12), las fases de migración y el estado del trabajo. Este documento
describe **la arquitectura de destino**, no el proceso para llegar a ella.

Cuando ambos documentos discrepen, **manda el plan** (D-11 y D-12 son las
últimas decisiones cerradas). Este documento se actualiza en la misma fase en
la que se implementa el cambio.

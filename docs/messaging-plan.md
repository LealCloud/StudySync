# Plan de implementación: Sistema de Mensajería

> Documento vivo. Se actualiza conforme avanza el trabajo.
> Fuente de verdad para el desarrollo del sistema de mensajería tipo Messenger.
>
> **Estado:** Fases 0, 1 y 2 **CERRADAS**. Fase 3 pendiente de inicio.
>
> **Documentos relacionados:**
>
> - `docs/backend-api/` — Contrato interno de métodos (v2.0).
> - `docs/backend-monolith-plan.md` — Arquitectura de destino.
> - `docs/user-settings-plan.md` — Plan de User Settings (fases 0–5 cerradas).

---

## 1. Contexto

### 1.1 Objetivo

Implementar un sistema de mensajería tipo Messenger dentro de StudySync que permita a los usuarios comunicarse de forma directa (1-a-1) desde el dashboard.

### 1.2 Ruta objetivo

```text
src/app/[locale]/(web)/dashboard/messages/page.tsx
```

El item `messages` ya existe en `src/config/dashboard-navigation.ts` para los menús de student y professor, y la traducción `dashboard.navigation.items.messages` ya existe en `es.json` y en `en.json`. La ruta `/messages` aún no está creada (verificado: `dashboard/` solo contiene `layout.tsx`, `page.tsx` y `user-settings/`).

### 1.3 Stack relevante

- Next.js 16 (App Router, Server + Client Components).
- React 19.
- URQL + `@urql/exchange-graphcache` (cliente GraphQL y caché normalizada).
- GraphQL Yoga como BFF en `/api/graphql`.
- Auth.js v5 (sesión minimalista: `id`, `role`).
- Prisma + PostgreSQL (persistencia).
- `next-intl` para i18n (español e inglés).
- `react-hook-form` + `zod` para formularios.
- Tailwind CSS v4.
- `framer-motion` para animaciones.

### 1.4 Relación con el contrato existente

El contrato `docs/backend-api/` (v2.0) ya define la matriz de privacidad que incluye `allowDirectMessages` en `PrivacySettings` y `PublicProfile`. El sistema de mensajería **consume** esa configuración, no la redefine.

El contrato del sistema de mensajería se añadirá a `docs/backend-api/` como nuevos métodos de dominio (`/users/me/conversations`, `/users/me/conversations/:id/messages`, etc.), siguiendo el patrón de los métodos existentes. Esto se hace como parte de la Fase 1 (sub-fase 1.12) para mantener el contrato sincronizado con el código.

---

## 2. Decisiones fijadas

| #   | Decisión                      | Valor                                                 | Notas                                                                                                                                                                        |
| --- | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Transporte en tiempo real     | Polling (casi tiempo real)                            | `useQuery` de URQL con `refetchInterval: 5000`. Diseñado para migrar a WebSockets sin reescribir la capa de dominio ni el BFF.                                               |
| M2  | Modelo de conversaciones      | DMs 1-a-1 con modelo extensible a grupos              | `Conversation` con `type: direct \| group`. En esta fase solo se crean `direct`. El modelo soporta `group` sin migración futura.                                             |
| M3  | Privacidad                    | `allowDirectMessages` como gate                       | Si el destinatario tiene `allowDirectMessages: false`, no se puede iniciar una conversación. El backend lo valida; el BFF y la UI también (defensa en profundidad).          |
| M4  | Paginación                    | Cursor-based para mensajes                            | `messages(conversationId, before: DateTime, limit: Int)`. Evita cargar todo el historial de una vez.                                                                         |
| M5  | Estado de lectura             | Per-participant `lastReadAt`                          | `ConversationParticipant.lastReadAt` es la fuente de verdad de "mensajes no leídos". El badge del sidebar cuenta conversaciones con `lastReadAt < lastMessageAt`.            |
| M6  | Patrón de mutaciones          | URQL + graphcache puro (D7 del plan de User Settings) | Toda mutación devuelve la entidad completa. `sendMessage` devuelve `Message` completo y un `updates` explícito para `myConversations` (porque la lista no normaliza por id). |
| M7  | Notificaciones en tiempo real | Diferidas (Fase 5)                                    | El badge del sidebar se actualiza por polling. Notificaciones push/email quedan fuera de esta fase.                                                                          |
| M8  | Adjuntos (archivos, imágenes) | Fuera de alcance inicial                              | Solo mensajes de texto. Adjuntos se planifican como Fase 5+ (requiere storage).                                                                                              |
| M9  | Edición y borrado             | Fuera de alcance inicial                              | Solo creación. Edición y borrado se planifican como Fase 5+.                                                                                                                 |
| M10 | Límite de `content`           | 2000 caracteres                                       | Alineado con `MESSAGE_MAX_LENGTH` de `src/lib/schemas/primitives.ts`. Mensajes más largos responden `422 VALIDATION_ERROR`.                                                  |
| M11 | Rutas del cliente             | Una sola página `/messages`                           | `MessagingClient` gestiona la conversación seleccionada con estado local, no con sub-rutas. Menos cambios en App Router; la selección es estado de UI.                       |

---

## 3. Modelo de negocio

### 3.1 Diagrama de entidades

```text
┌─────────────────┐
│      User       │
│─────────────────│
│ id              │
│ email           │
│ role            │
└───────┬─────────┘
        │
        ├──────────────── 1:N (sentMessages) ──────────────┐
        │                                                  │
        │ 1:N (conversationParticipants)                   ▼
        │                                     ┌──────────────────────────┐
        ▼                                     │         Message          │
┌──────────────────────────────┐              │──────────────────────────│
│   ConversationParticipant    │              │ id                       │
│──────────────────────────────│              │ conversationId  ─────┐   │
│ id                           │              │ senderId             │   │
│ conversationId  ─────────┐   │              │ content              │   │
│ userId                   │   │              │ createdAt            │   │
│ lastReadAt               │   │              └──────────────────────┼───┘
│ joinedAt                 │   │                                     │
│ @@unique(conv, user)     │   │                                     │ N:1
└──────────────────────────┼───┘                                     │
                           │ N:1                                     │
                           ▼                                         ▼
                    ┌───────────────────────────────────────────────────┐
                    │                   Conversation                    │
                    │───────────────────────────────────────────────────│
                    │ id                                                │
                    │ type: direct | group                              │
                    │ createdAt                                         │
                    │ updatedAt                                         │
                    └───────────────────────────────────────────────────┘
```

- **`Conversation`**: contenedor de mensajes. En esta fase, siempre `type: direct` con exactamente 2 participantes.
- **`ConversationParticipant`**: join table con `userId`, `conversationId`, `lastReadAt` y `joinedAt`.
- **`Message`**: mensaje de texto con `content`, `senderId`, `createdAt`.

### 3.2 Reglas de negocio

1. **Unicidad de DM:** Un par de usuarios solo puede tener una conversación `direct` activa. El backend reutiliza la conversación existente antes de crear una nueva.
2. **`allowDirectMessages`:** Al iniciar una conversación, el backend verifica `PrivacySettings.allowDirectMessages` del destinatario. Si es `false`, responde `403 FORBIDDEN`.
3. **Participación:** Solo los participantes de una conversación pueden leer los mensajes (`403 FORBIDDEN` si no lo son).
4. **Orden:** Los mensajes se devuelven en orden cronológico ascendente en la UI, pero la query los pide descendente (`before` + `limit`) para paginar.
5. **No leídos:** `ConversationParticipant.lastReadAt` se actualiza al llamar `markConversationAsRead`.
6. **Validación de `content`:** Entre 1 y 2000 caracteres. Vacío o excedido → `422 VALIDATION_ERROR`.
7. **Conversación propia:** Un usuario no puede iniciar una conversación consigo mismo (`422 VALIDATION_ERROR`).

### 3.3 Matriz de autorización

| Método                                    | Auth     | Autorización adicional                 |
| ----------------------------------------- | -------- | -------------------------------------- |
| `myConversations`                         | Required | —                                      |
| `startConversation(participantId)`        | Required | `allowDirectMessages` del destinatario |
| `messages(conversationId, before, limit)` | Required | Ser participante de la conversación    |
| `sendMessage(conversationId, content)`    | Required | Ser participante de la conversación    |
| `markConversationAsRead(conversationId)`  | Required | Ser participante de la conversación    |

---

## 4. Fases y subtareas

### Fase 0 — Decisiones y documentación ✅ CERRADA

**Objetivo:** Cerrar las decisiones arquitectónicas y documentar el plan.

- [x] **0.1** Decidir transporte (Polling vs. WebSockets). → M1.
- [x] **0.2** Decidir modelo de conversaciones (DMs vs. Grupos). → M2.
- [x] **0.3** Cerrar límite de `content`, polling interval y rutas del cliente. → M10, M11.
- [x] **0.4** Crear este archivo `docs/messaging-plan.md` con la estructura de los planes existentes.

**Estado (2026-11-12):** ✅ Cerrada. M1 (polling), M2 (DMs extensibles), M10 (2000 chars), M11 (una sola página) fijadas. Documento creado.

**Commit sugerido:** `docs(messaging): crear plan de implementación del sistema de mensajería`

---

### Fase 1 — Modelo de datos y capa de dominio ✅ CERRADA (1.1–1.10)

**Objetivo:** Tener la lógica de negocio funcionando sin UI.

- [x] **1.1** Añadir al `prisma/schema.prisma`:
  - Enum `ConversationType { direct, group }`.
  - `Conversation` (`id`, `type`, `createdAt`, `updatedAt`).
  - `ConversationParticipant` (`id`, `conversationId`, `userId`, `lastReadAt`, `joinedAt`). `@@unique([conversationId, userId])`.
  - `Message` (`id`, `conversationId`, `senderId`, `content`, `createdAt`).
  - Relaciones en `User`: `conversationParticipants` (1:N), `sentMessages` (1:N).
  - Índices: `Message(conversationId, createdAt DESC)`, `ConversationParticipant(userId)`.
  - `TODO(dm-uniqueness)` documentado en el schema para el par único de usuarios en conversaciones `direct`.
- [x] **1.2** Crear la migración con `pnpm prisma:migrate --name add_messaging`.
- [x] **1.3** Actualizar `prisma/seed.ts` con 1 conversación `direct` de ejemplo entre `student@example.com` y `teacher@example.com` con 3-4 mensajes. Los IDs de los mensajes serán fijos para que el seed sea idempotente.
- [x] **1.4** Definir en `src/lib/backend/types.ts`:
  - `BackendConversationType = 'direct' | 'group'`.
  - `BackendConversation` (`id`, `type`, `participants`, `lastMessage`, `lastMessageAt`, `unreadCount`).
  - `BackendConversationParticipant` (`id`, `user`, `lastReadAt`).
  - `BackendMessage` (`id`, `conversationId`, `sender`, `content`, `createdAt`).
- [x] **1.5** Añadir el grupo `messaging` a `BackendClient` en `src/lib/backend/client.ts`:
  - `getConversations(): Promise<BackendConversation[]>`.
  - `startConversation(participantId: string): Promise<BackendConversation>`.
  - `getMessages(conversationId: string, before?: string, limit?: number): Promise<BackendMessage[]>`.
  - `sendMessage(conversationId: string, content: string): Promise<BackendMessage>`.
  - `markAsRead(conversationId: string): Promise<BackendConversation>`.
- [x] **1.6** Crear `src/lib/domain/messaging.ts` con las 5 funciones y las reglas de negocio (3.2). Reutilizar `MESSAGE_MAX_LENGTH` de `primitives.ts`.
- [x] **1.7** Implementar `LocalBackendClient.messaging` en `src/lib/backend/local/client.ts`.
- [x] **1.8** Implementar `MockBackendClient.messaging` en `src/lib/mock/client.ts`, con estado en `globalThis.__mockStore`. Añadir `MockOperation` y `failures` para los 5 métodos.
- [x] **1.9** Añadir tests a `scripts/test-domain.ts` (5-6 casos):
  - Crear DM, verificar `allowDirectMessages: false` → 403.
  - Enviar mensaje, verificar límite de 2000 → 422.
  - `markConversationAsRead` actualiza `lastReadAt`.
  - No participante → 403.
  - Reutilizar DM existente.
- [x] **1.10** Añadir tests a `scripts/test-mock.ts` (5 queries + 3 mutations + 3 behavior tests).
- [x] **1.11** Documentar el contrato en `docs/backend-api/`:
  - Nuevo archivo `docs/backend-api/_rutas/users-me/messaging.md` con las 5 operaciones.
  - Actualizar `docs/backend-api/README.md` (tabla de métodos, autorización).
- [x] **1.12** `pnpm type-check`, `pnpm lint`, `pnpm domain:test`, `pnpm mock:test` en verde.

**Estado (2026-11-12):** ✅ Cerrada (1.1–1.10, 1.12). 1.11 diferida al bloque D (documentación del contrato). `type-check`, `lint`, `domain:test` (16/16), `mock:test` (58/58) en verde.

**Commit sugerido:** `feat(messaging): implementar capa de dominio del sistema de mensajería`

---

### Fase 2 — Contrato GraphQL (BFF) ✅ CERRADA (2.1–2.6 + extensiones)

**Objetivo:** Exponer la lógica de dominio a través de la API GraphQL.

- [x] **2.1** Crear `src/graphql/schema/messaging.graphql` con los tipos, queries y mutations.
- [x] **2.2** Crear operaciones GraphQL en `src/graphql/operations/messaging/`:
  - `my-conversations.graphql`, `messages.graphql`, `start-conversation.graphql`, `send-message.graphql`, `mark-conversation-as-read.graphql`.
- [x] **2.3** Regenerar tipos con `pnpm graphql:codegen`.
- [x] **2.4** Crear `src/graphql/resolvers/messaging.ts` y registrar en `src/graphql/resolvers/index.ts`.
- [x] **2.5** Aplicar `requireAuth` en todas las operaciones. La autorización de participación se delega a la capa de dominio (defensa en profundidad).
- [x] **2.6** `pnpm graphql:validate` en verde.

**Extensiones adelantadas desde Fase 3 (por coherencia con GraphQL):**

- [x] **3.6** Añadir `Conversation: (data) => data.id`, `ConversationParticipant: (data) => data.id` y `Message: (data) => data.id` a `keys` de `UrqlProvider.tsx`. Hecho en el bloque B.
- [x] **3.7** Añadir `updates.Mutation.sendMessage` en `UrqlProvider.tsx`. Hecho en el bloque B.
- [x] **3.8** Añadir `updates.Mutation.markConversationAsRead` en `UrqlProvider.tsx`. Hecho en el bloque B.
- [x] **1.11** Documentar el contrato en `docs/backend-api/`: `messaging.md` + `README.md` actualizado. Hecho en el bloque B.

**Estado (2026-11-12):** ✅ Cerrada. `graphql:validate`, `type-check`, `lint` en verde. `domain:test` 16/16, `mock:test` 63/63 (+5 tests GraphQL de mensajería). Contrato v2.0.1 documentado. `BackendMessage.senderId` añadido para normalización. `User.unreadMessagesCount` con `messaging.getUnreadCount()` (sin N+1, `groupBy`).

**Commit sugerido:** `feat(messaging): exponer mensajería vía GraphQL`

---

### Fase 3 — UI del cliente (Frontend)

**Objetivo:** Construir la interfaz de usuario.

- [ ] **3.1** Crear la página `src/app/[locale]/(web)/dashboard/messages/page.tsx` (Server Component) que renderiza `<MessagingClient />`.
- [ ] **3.2** Crear `MessagingClient.tsx` (Client Component) con layout de dos columnas: `ConversationList` | `ChatWindow`. Estado: `selectedConversationId`.
- [ ] **3.3** Crear `ConversationList.tsx`: lista con nombre del otro participante, avatar, último mensaje y badge de no leídos.
- [ ] **3.4** Crear `ChatWindow.tsx`: header con nombre del otro participante, lista de mensajes con scroll automático, input con Enter para enviar.
- [ ] **3.5** Polling: `useQuery` de `messages` y `myConversations` con `requestPolicy: 'network-only'` y `refetchInterval: 5000`.
- [ ] **3.6** Añadir `Conversation: (data) => data.id` y `Message: (data) => data.id` a `keys` de `UrqlProvider.tsx`.
- [ ] **3.7** Añadir `updates.Mutation.sendMessage` para actualizar `myConversations.lastMessage` y `lastMessageAt` sin refetch completo.
- [ ] **3.8** Añadir `updates.Mutation.markConversationAsRead` para actualizar `unreadCount`.
- [ ] **3.9** Añadir las claves i18n en `es.json` y `en.json` bajo `dashboard.messages.*` (título, placeholder, botón enviar, estado vacío, errores).
- [ ] **3.10** `pnpm type-check`, `pnpm lint` en verde.

**Commit sugerido:** `feat(messaging): implementar UI del chat`

---

### Fase 4 — Integración y puntos de entrada

**Objetivo:** Conectar la mensajería con el resto de la app.

- [ ] **4.1** Añadir botón "Enviar mensaje" en `PublicProfile` (si `allowDirectMessages` es `true`). Navega a `/messages?userId={id}`.
- [ ] **4.2** En `MessagingClient`, leer `searchParams.userId` para auto-iniciar/seleccionar la conversación con ese usuario.
- [ ] **4.3** Añadir `unreadMessagesCount` a `SidebarData` (query `myConversations` + count) y mostrar badge en el item `/messages` del sidebar.
- [ ] **4.4** Actualizar `updates.Mutation.sendMessage` para decrementar el badge.
- [ ] **4.5** Actualizar `updates.Mutation.markConversationAsRead` para decrementar el badge.
- [ ] **4.6** `pnpm type-check`, `pnpm lint`, `pnpm mock:test` en verde.

**Commit sugerido:** `feat(messaging): integrar mensajería con perfil público y sidebar`

---

### Fase 5 — Deudas diferidas (fuera de alcance inicial)

> Documentadas para no perderlas. No bloquean el cierre del plan.

- **`TODO(messaging-attachments)`:** Adjuntos (archivos, imágenes). Requiere storage (Vercel Blob, S3, Supabase Storage). Modelo: `MessageAttachment(messageId, url, type, size)`.
- **`TODO(messaging-edit-delete)`:** Edición y borrado de mensajes. Requiere `Message.editedAt` y `Message.deletedAt`.
- **`TODO(messaging-notifications)`:** Notificaciones push/email de mensajes no leídos.
- **`TODO(messaging-groups)`:** Conversaciones grupales. El modelo ya lo soporta (`ConversationType.group`), pero falta el flujo de creación, gestión de participantes y UI.
- **`TODO(messaging-realtime)`:** Migrar de polling a WebSockets. La capa de dominio y el BFF no cambian; solo el transporte del cliente.
- **`TODO(messaging-search)`:** Búsqueda de conversaciones y mensajes.
- **`TODO(messaging-typing-indicator)`:** Indicador de "escribiendo…". Requiere tiempo real verdadero.
- **`TODO(messages-pagination)`:** UI de "cargar más" para el historial. La paginación cursor-based está diseñada en la API, pero la UI inicial solo carga los últimos N mensajes.

---

## 5. Convenciones

### 5.1 Código

- Server Components para orquestación y fetching de sesión/traducciones.
- Client Components para la UI del chat (polling, estado local).
- Los datos de presentación siempre vienen del BFF vía GraphQL.
- Manejo de errores por código (`error.code`), nunca por texto.
- Sin `any`.

### 5.2 Commits

- Un commit por hito significativo (fin de fase o sub-fase grande).
- Mensajes en formato convencional:
  - `feat(messaging): descripción`
  - `fix(messaging): descripción`
  - `docs(messaging): descripción`
  - `test(messaging): descripción`
  - `chore(messaging): descripción`
- Descripción en español.

### 5.3 Archivos y naming

- Componentes: PascalCase (`ConversationList.tsx`).
- Hooks: camelCase con prefijo `use` (`useMessagingPolling.ts` si se extrae).
- Dominio: kebab-case (`messaging.ts`).
- Schema GraphQL: kebab-case (`messaging.graphql`).

---

## 6. Riesgos y mitigaciones

| Riesgo                                                      | Mitigación                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Polling genera carga innecesaria                            | `refetchInterval: 5000` como valor por defecto. Ajustable. Diseño permite migrar a WebSockets. |
| Condición de carrera al crear DM (doble click)              | Backend valida unicidad dentro de transacción; el cliente deshabilita el botón mientras envía. |
| Conversación `direct` duplicada                             | Backend reutiliza la conversación existente entre el par (`TODO(dm-uniqueness)`).              |
| `allowDirectMessages: false` bloquea al destinatario        | UI oculta el botón "Enviar mensaje" en `PublicProfile` cuando `allowDirectMessages === false`. |
| Graphcache no normaliza bien                                | `Conversation` y `Message` con `id` propio y key explícita en `UrqlProvider`.                  |
| Polling pierde mensajes si el usuario no está en la pestaña | El polling se reanuda al volver el foco (`visibilitychange`). Fase 5+.                         |

---

## 7. Deudas conocidas

- **`TODO(dm-uniqueness)`:** ✅ Resuelto en el bloque A. `Conversation.directKey` es `String? @unique`; se calcula como `[userIdA, userIdB].sort().join(':')` para DMs y es `null` para grupos. Garantía a nivel de DB sin romper la extensibilidad a grupos.
- **`TODO(messages-pagination)`:** La paginación cursor-based está diseñada pero la UI inicial solo carga los últimos N mensajes. La UI de "cargar más" se implementa en Fase 5+.
- **`TODO(messaging-realtime)`:** Ver Fase 5.
- **`TODO(seed-messaging-idempotent)`:** El seed de mensajes usa IDs fijos (`msg_001`, `msg_002`, `msg_003`) y `upsert` por PK. Verificado: dos ejecuciones seguidas no duplican.
- **`TODO(messaging-mock-graphql-tests)`:** ✅ Resuelto en el bloque B. 5 tests GraphQL añadidos en `scripts/test-mock.ts` (`myConversations`, `messages`, `startConversation`, `sendMessage`, `markConversationAsRead`). `mock:test` 63/63.
- **`TODO(messaging-getConversations-test)`:** ✅ Resuelto en el bloque A. Test añadido en `scripts/test-domain.ts`.
- **`TODO(messaging-n+1)`:** ✅ Resuelto en el bloque A. `mapMessage` y `mapConversation` no hacen queries; usan `include` + `groupBy`.
- **`TODO(rate-limit-messaging)`:** Límites documentados pero no implementados: 30 mensajes/minuto para `sendMessage`, 10/minuto para `startConversation`. Se aplican en un bloque de hardening. Ver `docs/backend-api/_rutas/users-me/messaging.md`.
- **`TODO(sidebar-unread-count)`:** `useSidebarData` todavía no expone `unreadMessagesCount` aunque la query `SidebarData` lo pide. Se resuelve en la Fase 4.3.
- **`TODO(sendMessage-sender)`:** El `updates.Mutation.sendMessage` de `UrqlProvider` no incluye `sender` en `lastMessage`. Si en el futuro `MyConversationsDocument` pide `lastMessage { sender { ... } }`, este `update` debe ampliarse.
- **`TODO(messaging-resolvers-structure)`:** `src/graphql/resolvers/index.ts` expone `Message` y `User` como propiedades de primer nivel del objeto `resolvers` en lugar de anidarlos bajo un tipo. Funciona, pero es inconsistente con el resto de resolvers (que van dentro de `Query` y `Mutation`). Reevaluar si añadimos más resolvers de campo.

---

## 8. Referencias

- `docs/backend-api/_rutas/users-me/privacy.md` — `allowDirectMessages`.
- `docs/backend-api/_rutas/users-me/public-profile.md` — `allowDirectMessages` en `PublicProfile`.
- `docs/backend-monolith-plan.md` — Arquitectura de destino (Prisma + Auth.js puro + BFF).
- `docs/user-settings-plan.md` — Patrón de mutaciones (D7), patrón de UI (D8).
- `src/lib/schemas/primitives.ts` — `MESSAGE_MAX_LENGTH`.

---

## 9. Bitácora

| Fecha      | Fase                      | Estado      | Notas                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | Fase 0 — Decisiones       | **Cerrada** | M1 (polling), M2 (DMs extensibles), M10 (2000 chars), M11 (una sola página) fijadas. Documento creado.                                                                                                                                                                                                                                                                                             |
| 2026-11-12 | Fase 1 — Modelo y dominio | **Cerrada** | Prisma: `Conversation`, `ConversationParticipant`, `Message` + enum `ConversationType`. Migración `20261112000000_add_messaging`. Dominio en `src/lib/domain/messaging.ts` (sin N+1: include + `groupBy`). `LocalBackendClient.messaging` y `MockBackendClient.messaging`. `domain:test` 16/16, `mock:test` 58/58. 1.11 (contrato) diferida al bloque D.                                           |
| 2026-11-12 | Fase 2 — Contrato GraphQL | **Cerrada** | Schema `messaging.graphql`, 5 operaciones, `messagingResolvers` con `requireAuth`. `BackendMessage.senderId` añadido. `User.unreadMessagesCount` con `getUnreadCount()` (groupBy, sin N+1). `UrqlProvider` con keys + `updates.Mutation.sendMessage` + `markConversationAsRead`. Tests GraphQL de mock (5 nuevos, 63/63). Contrato v2.0.1 documentado. 1.11, 3.6, 3.7, 3.8 adelantadas y cerradas. |
| —          | Fase 3 — UI del cliente   | Pendiente   | —                                                                                                                                                                                                                                                                                                                                                                                                  |
| —          | Fase 4 — Integración      | Pendiente   | —                                                                                                                                                                                                                                                                                                                                                                                                  |
| —          | Fase 5 — Deudas diferidas | Pendiente   | Adjuntos, edición/borrado, notificaciones, grupos, realtime, búsqueda, typing indicator, paginación UI.                                                                                                                                                                                                                                                                                            |

---
resource: users-me-messaging
methods: [GET, POST]
auth: Required
consumers:
  - src/graphql/resolvers/messaging.ts
  - src/components/layout/dashboard/sidebar/useSidebarData.ts
contract_version: v2.0
---

# Mensajería de `/users/me`

Operaciones para listar conversaciones directas, consultar y enviar mensajes,
iniciar una conversación y actualizar su estado de lectura.

## Autenticación

`Required` en todas las operaciones. Cada petición se ejecuta en el contexto
del usuario autenticado.

## Operaciones

| Operación                | Ruta conceptual                             | Respuesta               |
| :----------------------- | :------------------------------------------ | :---------------------- |
| `myConversations`        | `GET /users/me/conversations`               | `BackendConversation[]` |
| `startConversation`      | `POST /users/me/conversations`              | `BackendConversation`   |
| `messages`               | `GET /users/me/conversations/:id/messages`  | `BackendMessage[]`      |
| `sendMessage`            | `POST /users/me/conversations/:id/messages` | `BackendMessage`        |
| `markConversationAsRead` | `POST /users/me/conversations/:id/read`     | `BackendConversation`   |

## Reglas de negocio

Se aplican las reglas de mensajería definidas en [`docs/messaging-plan.md`](../../../messaging-plan.md), §3.2:

- `startConversation` comprueba `allowDirectMessages` del destinatario. Si está
  desactivado, responde `403 FORBIDDEN`.
- Solo un participante puede leer, enviar mensajes o marcar una conversación
  como leída; cualquier usuario ajeno recibe `403 FORBIDDEN`.
- `content` debe contener entre 1 y 2000 caracteres. El dominio comprueba el
  límite sobre el texto recortado y conserva el contenido enviado.
- Un par de usuarios reutiliza su conversación directa, identificada por el
  `directKey` formado por sus IDs ordenados y unidos por `:`.
- Un usuario no puede iniciar una conversación consigo mismo; recibe
  `422 VALIDATION_ERROR`.
- Los mensajes se consultan con `before` y `limit` para paginar. El límite
  predeterminado es 50 y el máximo es 100.
- `lastReadAt` de cada participante determina los mensajes no leídos.

## Respuesta

`BackendConversation` contiene `id`, `type`, participantes, `lastMessage`,
`lastMessageAt` y `unreadCount`. Cada participante incluye su usuario y
`lastReadAt`.

`BackendMessage` contiene `id`, `conversationId`, el usuario completo
`sender`, `content` y `createdAt` en ISO 8601. El contrato GraphQL expone además
`senderId` para facilitar filtros y normalización de caché.

`User.unreadMessagesCount` devuelve el total de mensajes no leídos solo cuando
el usuario resuelto es el usuario autenticado; para cualquier otro usuario
devuelve `0`.

## Errores

|  HTTP | Código             | Cuándo                                                 |
| ----: | :----------------- | :----------------------------------------------------- |
| `401` | `UNAUTHENTICATED`  | No hay usuario autenticado.                            |
| `403` | `FORBIDDEN`        | El usuario no participa o el destinatario bloqueó DMs. |
| `404` | `NOT_FOUND`        | No existe el destinatario o la conversación.           |
| `422` | `VALIDATION_ERROR` | Contenido inválido o intento de hablar consigo mismo.  |

## Rate limiting

El dominio todavía no aplica límites por frecuencia. `sendMessage` queda
documentado para 30 mensajes/minuto por usuario y `startConversation` para 10
inicios/minuto. Las lecturas y `markConversationAsRead` no tienen límite en esta
fase.

`TODO(rate-limit-messaging)`: aplicar estos límites en un bloque posterior de
hardening.

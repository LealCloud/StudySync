---
resource: auth/logout
methods: [POST]
auth: None
consumers:
  - src/auth.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§10, §11"
contract_version: v1.3.1
---

# POST /auth/logout

Revoca el Refresh Token del usuario.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "refreshToken": "current-refresh-token"
}
```

## Comportamiento

Debe ser idempotente cuando sea posible: revocar un token ya revocado no debe fallar con error de dominio.

## Errores

| HTTP  | Código            | Cuándo                                |
| ----: | ----------------- | ------------------------------------- |
| `400` | `BAD_REQUEST`     | Petición mal formada                  |
| `401` | `UNAUTHENTICATED` | Refresh Token inválido o vencido      |
| `500` | `INTERNAL_ERROR`  | Error interno                         |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).

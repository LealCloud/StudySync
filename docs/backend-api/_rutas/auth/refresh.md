---
resource: auth/refresh
methods: [POST]
auth: None
consumers:
  - src/auth.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§3.3, §11"
contract_version: v1.3.1
---

# POST /auth/refresh

Rota el Refresh Token y emite un nuevo par de tokens.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "refreshToken": "current-refresh-token"
}
```

## Comportamiento

Debe existir **rotación de Refresh Token**:

1. El cliente envía el Refresh Token actual.
2. El backend valida el token.
3. El backend devuelve un nuevo Access Token.
4. El backend devuelve un nuevo Refresh Token.
5. El Refresh Token anterior deja de ser válido.

Un Refresh Token vencido, inválido o revocado debe responder:

```text
401 o 403
```

El frontend interpreta ambos códigos como finalización de sesión.

`400` se utiliza únicamente cuando el cuerpo de la petición está mal formado.

Los errores `5xx` se consideran errores temporales del servicio y no significan automáticamente que la sesión haya terminado.

## Errores

| HTTP  | Código            | Cuándo                                |
| ----: | ----------------- | ------------------------------------- |
| `400` | `BAD_REQUEST`     | Cuerpo mal formado (solo este caso)   |
| `401` | `UNAUTHENTICATED` | Refresh Token inválido o vencido      |
| `403` | `FORBIDDEN`       | Refresh Token revocado                |
| `429` | `RATE_LIMITED`    | Demasiados intentos                   |
| `500` | `INTERNAL_ERROR`  | Error interno                         |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).

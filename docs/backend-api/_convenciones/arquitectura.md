---
kind: convention
source_legacy: '§1, §1.1, §12'
contract_version: v1.3.1
---

# Arquitectura

## Cómo funciona

```text
Dashboard (React)  →  GraphQL (BFF)  →  API REST del backend

Sitio público (login, registro, recuperar contraseña, contacto)
        → API REST del backend
```

- Dentro del dashboard el frontend habla solo con GraphQL. El BFF traduce cada operación GraphQL a una llamada REST al backend.
- Fuera del dashboard, el servidor de Next.js llama al REST directamente para login, registro, recuperar contraseña y contacto.
- El backend **no debe confiar** en que la petición venga del BFF. Siempre debe validar el token y los permisos.

La URL base del backend es `API_BASE_URL`. Todas las rutas de este contrato son relativas a ella.

---

## Modos de operación

El contrato v1.3.1 puede implementarse en dos modos:

| Modo   | Cuándo se usa                                                     | Fuente de datos                    |
| ------ | ----------------------------------------------------------------- | ---------------------------------- |
| `rest` | Entorno real. El frontend/BFF habla con el backend por HTTP.      | Backend en `API_BASE_URL`.         |
| `mock` | Entorno controlado (desarrollo, pruebas, demos) sin backend real. | Implementación local del contrato. |

El modo se selecciona mediante configuración del cliente (`BACKEND_MODE`), no mediante cambios en el contrato ni en los resolvers GraphQL.

### Regla de equivalencia

Ambos modos implementan **el mismo contrato**:

- Las operaciones expuestas por el cliente son idénticas.
- Los tipos de entrada y salida son idénticos.
- Los códigos HTTP y los `error.code` son idénticos.
- Los resolvers GraphQL y los route handlers no distinguen el modo.

### Alcance del modo `mock`

El modo `mock` cubre las operaciones que el frontend/BFF consume a través del cliente del contrato (ver [`README.md`](../README.md#relación-con-el-frontend), "Relación con el frontend").

Las rutas de autenticación pública y contacto (`/auth/*` y `/contact`) son consumidas por Auth.js y los route handlers de Next.js. Si se requiere operar esas rutas sin backend, deben cubrirse mediante un cliente equivalente, no extendiendo el cliente del dashboard.

### Garantías del modo `mock`

- No realiza peticiones de red.
- Devuelve datos deterministas y válidos según este contrato.
- Respeta los formatos definidos en [`reglas-transversales.md`](reglas-transversales.md).
- Puede simular los errores definidos en [`errores.md`](errores.md) y en cada archivo de ruta.

### Regla de validez

Ningún modo puede alterar el contrato. Cualquier diferencia entre modos se considera un defecto de implementación, no una variación del contrato.

---

## Qué hace cada capa

### Dashboard

El dashboard utiliza únicamente GraphQL.

```text
React → GraphQL → BFF → Backend
```

No llama al REST directamente.

### Sitio público

Auth.js utiliza:

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

Los route handlers de Next.js utilizan:

```text
POST /auth/register
POST /auth/forgot-password
POST /auth/reset-password
POST /contact
```

Estos handlers deben aplicar la validación correspondiente antes de reenviar las peticiones.

### BFF GraphQL

El BFF:

- expone el contrato GraphQL;
- valida autenticación cuando corresponde;
- utiliza `BackendClient`;
- no debe acoplar los resolvers directamente a REST;
- debe interpretar los errores del backend mediante `error.code`;
- puede transformar errores REST a errores GraphQL;
- puede convertir comportamientos específicos como `404` de perfil público a `null`, según el contrato GraphQL;
- no debe depender de que exista un backend real para arrancar, renderizar o resolver operaciones cubiertas por el modo `mock`.

### Backend principal

El backend es responsable de:

- autenticación;
- autorización;
- validación;
- reglas de negocio;
- persistencia;
- integraciones externas;
- seguridad;
- consistencia de datos.

El backend **no debe depender del BFF para aplicar seguridad**.

El backend **no es un requisito de arranque** para el frontend/BFF cuando el modo activo es `mock`. El frontend/BFF debe poder iniciar, renderizar y resolver las operaciones cubiertas por el contrato sin que exista un backend disponible.

Cualquier cambio incompatible en este contrato debe coordinarse entre ambos lados antes de implementarse.

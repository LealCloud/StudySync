---
resource: users-me-courses
methods: [GET]
auth: Required
consumers:
  - src/graphql/resolvers/courses.ts
source_legacy: "§5, §11"
contract_version: v1.3.1
---

# GET /users/me/courses

Inscripciones de cursos del usuario autenticado.

## Autenticación

`Required`.

## Respuesta

`BackendCourseEnrollment[]`:

| Campo          | Tipo                     |
| :------------- | :----------------------- |
| `courseId`     | `string`                 |
| `title`        | `string`                 |
| `progress`     | `number` (Float)         |
| `status`       | `CourseEnrollmentStatus` |
| `enrolledAt`   | `string` (ISO 8601)      |
| `completedAt`  | `string \| null` (ISO 8601) |

`CourseEnrollmentStatus` es el enum cerrado `active | completed | paused`.

Reglas:

- `progress` está en el rango `[0.0, 1.0]`. Si está fuera de rango, el backend lo normaliza o lo rechaza con `500` por error de datos, no por una entrada inválida del usuario.
- El estado `paused` no es asignable desde User Settings. Lo asigna otro módulo (Courses o Learning Paths).

## Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin`.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

## Errores

| HTTP  | Código             | Cuándo                                          |
| ----: | ------------------ | ----------------------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token inválido o vencido                        |
| `403` | `FORBIDDEN`        | `teacher` / `admin`                             |
| `500` | `INTERNAL_ERROR`   | `progress` fuera de rango (error de datos)      |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).

# Plan de implementación: User Settings

> Documento vivo. Se actualiza conforme avanza el trabajo.
> Fuente de verdad para el desarrollo de la sección de configuración de usuario.

---

## 1. Contexto

### 1.1 Objetivo

Implementar la sección **User Settings** del dashboard, que permite a cada usuario
gestionar su perfil, seguridad, preferencias y — según su rol — otras áreas de
autoservicio.

### 1.2 Ruta objetivo

```text
frontend/src/app/[locale]/(web)/dashboard/user-settings
```

### 1.3 Stack relevante

- **Next.js 16** (App Router, Server + Client Components).
- **React 19**.
- **URQL** + **@urql/exchange-graphcache** (cliente GraphQL y caché normalizada).
- **GraphQL Yoga** como BFF en `/api/graphql`.
- **NextAuth v5** (sesión minimalista: `id`, `role`, `error`).
- **next-intl** para i18n (español e inglés).
- **react-hook-form** + **zod** para formularios.
- **framer-motion** para animaciones y modales.

### 1.4 Relación con el contrato BACKEND_API.md

El contrato `docs/BACKEND_API.md` (**v1.3**) es la fuente de verdad para toda
comunicación con el backend REST. Toda decisión de UI y de BFF debe respetarlo.
Cualquier cambio necesario se reflejará primero en el contrato.

### 1.5 Modo mock

`BACKEND_MODE=mock` permite desarrollar y probar toda esta sección sin backend
real. Es el modo recomendado durante el desarrollo.

---

## 2. Decisiones fijadas

| #   | Decisión                                | Valor                                                                                                                                                                                    |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Autorización por rol                    | **En el BFF**, siguiendo el contrato                                                                                                                                                     |
| D2  | Privacy en el alcance                   | **Sí**, es universal                                                                                                                                                                     |
| D3  | Account deactivation para teacher/admin | **Fuera del alcance** (baja por admin/TI)                                                                                                                                                |
| D4  | Orden de secciones                      | Profile → Personal Data → Security → Preferences → Privacy → [Account] → [Courses] → [Certificates] → [Billing]                                                                          |
| D5  | Idioma de este documento                | Español                                                                                                                                                                                  |
| D6  | Commits                                 | Por hitos significativos (no por cada subtarea, sí por cada fase o sub-fase grande)                                                                                                      |
| D7  | Patrón de mutaciones                    | URQL + graphcache puro. Toda mutación que modifique una entidad con `id` devuelve la entidad completa. Toda mutación que modifique listas incluye `updates` explícito en `UrqlProvider`. |
| D8  | Patrón de modales de confirmación       | `<ConfirmDialog>` único para acciones destructivas. Formularios inline en `<SectionCard>` para el resto.                                                                                 |

---

## 3. Modelo de negocio

La sección User Settings se organiza según **dos ejes ortogonales**:

1. **Eje de dominio** — qué tipo de información gestiona la sección.
2. **Eje de rol** — a qué roles aplica.

### 3.1 Mapa sección × rol

| Sección                | student | teacher | admin | Notas                                              |
| ---------------------- | ------- | ------- | ----- | -------------------------------------------------- |
| Profile                | ✅      | ✅      | ✅    | Bio, intereses, avatar. Universal.                 |
| Personal Data          | ✅      | ✅      | ✅    | Nombre, doc, teléfono, dirección. Universal.       |
| Security               | ✅      | ✅ ⚠️   | ✅ ⚠️ | **2FA obligatorio para teacher y admin.**          |
| Preferences            | ✅      | ✅      | ✅    | Idioma, tema, timezone, notificaciones. Universal. |
| Privacy                | ✅      | ✅      | ✅    | Qué expone en su perfil público. Universal.        |
| Account (deactivation) | ✅      | ❌      | ❌    | Solo student.                                      |
| Courses                | ✅      | ❌      | ❌    | Solo student. Lectura.                             |
| Certificates           | ✅      | ❌      | ❌    | Solo student. Lectura + descarga.                  |
| Billing                | ✅      | ❌      | ❌    | Solo student. Métodos de pago + suscripción.       |

### 3.2 Regla especial de Security

- **student**: 2FA opcional. Puede activarlo y desactivarlo.
- **teacher / admin**: 2FA obligatorio desde el arranque. Puede activarlo,
  **no desactivarlo**.
  - El contrato ya lo soporta: `POST /users/me/security/two-factor/disable`
    responde `403` cuando `twoFactorRequired: true`.
  - La UI debe **ocultar o deshabilitar** la acción de desactivar cuando
    `SecuritySettings.twoFactorRequired === true`.
    - **Bloqueo en el BFF (implementado en Fase 1):** la mutación
      `disableTwoFactor` responde `403 FORBIDDEN` en el BFF si
      `session.user.role !== 'student'`, sin llamar al backend. Es la primera
      regla de autorización por rol del BFF (ver Fase 1, helper `requireRole`,
      commit `3d03535`).
- **Medio de 2FA:** por ahora, correo electrónico. El código es de 6 dígitos
  numéricos. Múltiples medios (SMS, TOTP app, códigos de respaldo) quedan
  fuera del alcance y se documentan como TODO.
- **Flujo de login con 2FA:** fuera del alcance actual. Ver TODO(auth-2fa)
  en `src/auth.ts`. Se resolverá con un modal en el login cuando se
  implemente.

### 3.3 Sobre Account (deactivation)

Solo disponible para `student`.

Motivo: `teacher` y `admin` son perfiles operativos del sistema. Su baja la
gestiona un administrador o el área de TI, no el propio usuario. Esto se
refleja tanto en la UI (no se renderiza la sección) como en el BFF
(`requestAccountDeactivation` responde `403` para esos roles).

### 3.4 Distinción clave: vista propia vs. vista pública

- **Vista propia** (lo que el usuario ve de sí mismo): `me`, `myProfile`,
  `myPersonalData`, `mySecuritySettings`, `myPreferences`, `myPrivacySettings`,
  `myAccount`.
- **Vista pública** (lo que otros ven del usuario): `publicProfile(userId)`.

La sección **Privacy** controla qué campos de la vista pública se exponen
(`profileVisibility`, `emailVisibility`, `phoneVisibility`,
`allowDirectMessages`).

---

## 4. Alcance

### 4.1 Dentro del alcance

- Secciones universales: Profile, Personal Data, Security, Preferences, Privacy.
- Secciones exclusivas de student: Account, Courses, Certificates, Billing.
- Autorización por rol en el BFF para todas las operaciones expuestas.
- Visibilidad condicional por rol en el orquestador de la página.

### 4.2 Fuera del alcance

- Flujo "solicitar baja" para teacher/admin.
- Vista de facturación en la que un admin gestione cuentas de otros usuarios.
- Migración de datos o scripts de mantenimiento.

### 4.3 Pendientes

- [x] Análisis del schema sección por sección: Profile ✅, Personal Data ✅,
      Security ✅, Preferences ✅, Privacy ✅, Account ✅, Courses ✅,
      Certificates ✅, Billing ✅.
- [x] Validación y ajustes del contrato de la API para cada sección (ver sección 8):
      Profile ✅, Personal Data ✅, Security ✅, Preferences ✅, Privacy ✅,
      Account ✅, Courses ✅, Certificates ✅, Billing ✅.
- [x] Sub-fase 0.6 (reorganización de Zod y códigos de error). **Cerrada e
      implementada en código** (commit
      `refactor(schemas): reorganizar schemas Zod y códigos de error por dominio`).

Sin pendientes bloqueantes. Fase 2 (Infraestructura UI compartida) lista para
iniciar.

---

## 5. Análisis del schema (sección por sección)

> Esta sección se completará de forma iterativa. Cada bloque se añade cuando
> se analice la sección correspondiente.

### 5.1 Profile

#### 5.1.1 Tipos GraphQL

```graphql
type Bio {
  title: String
  description: String
}

type User {
  id: ID!
  name: String!
  email: String!
  image: String
  role: UserRole!
  profile: Profile!
}

type Profile {
  bio: Bio
  interests: [String!]!
}

input UpdateBioInput {
  title: String
  description: String
}

input UpdateProfileInput {
  bio: UpdateBioInput
  interests: [String!]
  image: String
}
```

Notas:

- `image` vive en `User`, no en `Profile`, aunque la mutación `updateProfile` sí lo acepta.
- `Bio.title` y `Bio.description` son nullable. `null` indica que el campo no tiene valor.

#### 5.1.2 Queries

- `me -> User!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/profile/my-profile.graphql`.
- `publicProfile(userId: ID!) -> PublicProfile` (vista pública, consumida por otros usuarios; relevante para Privacy, no para esta sección).
- No existe una query dedicada `myProfile`. Se usa `me`.

#### 5.1.3 Mutations

`updateProfile(input: UpdateProfileInput!): User!` — única mutación de esta sección. Devuelve el `User` completo actualizado.

Semántica PATCH parcial:

| Campo             | Campo omitido (`undefined`) | Valor `null`              | Valor nuevo                         |
| ----------------- | --------------------------- | ------------------------- | ----------------------------------- |
| `bio`             | No se modifica              | Borra la bio completa     | Aplica PATCH parcial dentro del bio |
| `bio.title`       | No se modifica              | Borra el título           | Asigna nuevo título                 |
| `bio.description` | No se modifica              | Borra la descripción      | Asigna nueva descripción            |
| `interests`       | No se modifica              | Borra todos los intereses | Reemplaza la lista completa         |
| `image`           | No se modifica              | Borra la imagen           | Asigna nueva imagen                 |

#### 5.1.4 Campos editables vs. solo lectura

| Campo             | Editable aquí | Notas                                                            |
| ----------------- | ------------- | ---------------------------------------------------------------- |
| `bio.title`       | ✅            | 1-100 caracteres.                                                |
| `bio.description` | ✅            | 1-500 caracteres.                                                |
| `interests`       | ✅            | Chips, máx. 20 items, 1-40 caracteres cada uno.                  |
| `image`           | ✅            | URL, data URI o `null`. Data URI por ahora (ver 8.2.3).          |
| `id`              | ❌            | Solo lectura.                                                    |
| `name`            | ❌            | Derivado de `firstName` + `lastName`. Se edita en Personal Data. |
| `email`           | ❌            | Se gestiona en Security (email change).                          |
| `role`            | ❌            | Solo lectura.                                                    |

#### 5.1.5 Restricciones por rol

Universal: student, teacher, admin.

#### 5.1.6 Estados de UI a manejar

- **Loading:** primer fetch de `me`.
- **Empty:** `bio === null`, `interests === []`, `image === null`. El usuario debe poder rellenarlos.
- **Editing:** campos con cambios pendientes.
- **Saving:** mutación en vuelo.
- **Success:** feedback tras guardar.
- **Error:** `422 VALIDATION_ERROR` (y `401` por problemas de token).

#### 5.1.7 Restricciones del contrato

`PATCH /users/me/profile` -> `401`, `422`.

Validaciones de longitud:

- `bio.title`: 1-100.
- `bio.description`: 1-500.
- `interests`: máx. 20 items, cada uno 1-40 caracteres.

#### 5.1.8 Decisiones de UX

- La bio se edita como bloque, con PATCH parcial dentro del bio (`title` y `description` por separado).
- `interests` con UI de chips (input + Enter, botón para eliminar cada uno).
- `image`: flujo actual con data URI. Se deja TODO para endpoint de subida dedicado (ver 8.2.3).
- Validación de cliente con zod (`profileSchema`), creado en Fase 3.

#### 5.1.9 Interacciones con otras partes del sistema

- `SidebarData` (`me { name, email, image, role }`) refleja el cambio de `image` vía graphcache sin refetch. **Verificado en paso 7:** `User: (data) => data.id` en `UrqlProvider` normaliza la mutación `updateProfile(input: { image })` y el sidebar se actualiza automáticamente.
- `publicProfile` refleja `bio`, `interests`, `image` según Privacy.
- ✅ **Cerrado (paso 7, commit `d3dd484`):** `ProfileAvatarSettings` refactorizado. `router.refresh()` eliminado. `useEffect` de sincronización de `image` eliminado. La imagen se deriva directamente de `useSidebarData()`.
- ✅ **Nuevo:** `CertificateEligibility` convertido a Client Component (mínimo). Obtiene `hasAvatar` de `useSidebarData()` en lugar de recibirlo por prop. El `TODO` de Fase 5 (sumar requisitos reales) se mantiene.
- ✅ **Nuevo:** `ProfileFormClient` (bio + `interests`) es independiente del avatar. Usa `profileSchema` y `useSectionMutation(UpdateProfileDocument)`. El avatar y el perfil tienen sus propios formularios y botones de guardar (patrón D8: una mutación = un formulario).

### 5.2 Personal Data

#### 5.2.1 Tipos GraphQL

```graphql
enum DocumentType {
  passport
  dni
}

type PersonalData {
  firstName: String!
  lastName: String!
  documentType: DocumentType
  documentId: String
  phone: String
  country: String
  address: String
  identityLocked: Boolean!
}

input UpdatePersonalDataInput {
  firstName: String
  lastName: String
  documentType: DocumentType
  documentId: String
  phone: String
  country: String
  address: String
}
```

Notas:

- `firstName` y `lastName` son `String!` en la respuesta y `String` en el input, pero no aceptan `null` en el input (ver 5.2.3).
- `documentType` es un enum cerrado `passport | dni`, nullable en la respuesta.
- `documentId`, `phone`, `country` y `address` son nullables.
- `identityLocked` es solo lectura (`Boolean!`), nunca editable.

#### 5.2.2 Queries

- `myPersonalData -> PersonalData!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/settings/my-personal-data.graphql`.
- No existe query dedicada `myProfile` ni `me` reutilizable para estos datos; `me` devuelve `name`, `email`, `image`, `role` y `profile`, no los datos personales. Por eso `myPersonalData` es independiente.
- `publicProfile(userId: ID!) -> PublicProfile` devuelve `name`, `image`, `bio`, `interests`, `email` y `phone` según Privacy. No expone `documentType`, `documentId`, ni `address`.

#### 5.2.3 Mutations

`updatePersonalData(input: UpdatePersonalDataInput!): PersonalData!` — única mutación de esta sección. Devuelve el `PersonalData` completo actualizado.

Semántica PATCH parcial:

| Campo          | Omitido (`undefined`) | `null`                       | Valor nuevo                |
| -------------- | --------------------- | ---------------------------- | -------------------------- |
| `firstName`    | No se modifica        | `422 VALIDATION_ERROR`       | Se asigna (con validación) |
| `lastName`     | No se modifica        | `422 VALIDATION_ERROR`       | Se asigna (con validación) |
| `documentType` | No se modifica        | Borra el tipo de documento   | Se asigna                  |
| `documentId`   | No se modifica        | Borra el número de documento | Se asigna                  |
| `phone`        | No se modifica        | Borra el teléfono            | Se asigna                  |
| `country`      | No se modifica        | Borra el país                | Se asigna                  |
| `address`      | No se modifica        | Borra la dirección           | Se asigna                  |

Regla adicional: `firstName` y `lastName` nunca pueden quedar vacíos ni ser `null`. La validación corre en el BFF y en el backend. El mock también debe rechazar `null` en esos campos con `422 VALIDATION_ERROR`.

#### 5.2.4 Campos editables vs. solo lectura

| Campo            | Editable aquí | Notas                                                                        |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| `firstName`      | ✅            | 2-100 caracteres. No acepta `null`. Bloqueado si `identityLocked === true`.  |
| `lastName`       | ✅            | 2-100 caracteres. No acepta `null`. Bloqueado si `identityLocked === true`.  |
| `documentType`   | ✅            | Enum `passport` \| `dni`. Bloqueado si `identityLocked === true`.            |
| `documentId`     | ✅            | 1-30 caracteres alfanuméricos. Bloqueado si `identityLocked === true`.       |
| `phone`          | ✅            | Formato E.164. No bloqueado por `identityLocked`.                            |
| `country`        | ✅            | ISO 3166-1 alpha-2 (2 letras mayúsculas). No bloqueado por `identityLocked`. |
| `address`        | ✅            | 1-200 caracteres. No bloqueado por `identityLocked`.                         |
| `identityLocked` | ❌            | Solo lectura. Controla el bloqueo de los campos de identidad.                |

Regla de bloqueo (`identityLocked === true`):

- **Bloqueo atómico:** si el PATCH incluye al menos un campo de identidad (`firstName`, `lastName`, `documentType`, `documentId`), el BFF y el backend responden `403 FORBIDDEN` y ningún campo se actualiza, ni siquiera los de contacto que vinieran en el mismo payload.
- Si el PATCH solo incluye campos de contacto (`phone`, `country`, `address`), se aplica normalmente.
- La UI debe deshabilitar los campos de identidad cuando `identityLocked === true` y mostrar el motivo al usuario (badge "Bloqueado" + tooltip explicativo).

#### 5.2.5 Restricciones por rol

Universal: student, teacher, admin.

No hay reglas por rol específicas para esta sección. La regla `identityLocked` aplica a todos los roles.

#### 5.2.6 Estados de UI a manejar

- **Loading:** primer fetch de `myPersonalData`.
- **Empty:** todos los campos opcionales son `null`. El usuario debe poder rellenarlos. `firstName` y `lastName` siempre tienen valor (vienen del registro).
- **Locked:** `identityLocked === true`. Los campos de identidad se muestran deshabilitados con badge "Bloqueado". Los campos de contacto siguen editables.
- **Editing:** campos con cambios pendientes.
- **Saving:** mutación en vuelo.
- **Success:** feedback tras guardar.
- **Error:**
  - `422 VALIDATION_ERROR` → errores por campo (longitud, formato, `null` en `firstName`/`lastName`).
  - `403 FORBIDDEN` → intento de modificar campos de identidad con `identityLocked === true`.
  - `401 UNAUTHENTICATED` → problema de token.
  - `409 CONFLICT` → reservado por si el backend introduce validaciones de unicidad sobre `documentId` en el futuro.

#### 5.2.7 Restricciones del contrato

`PATCH /users/me/personal-data` → `401`, `403` (identidad bloqueada), `409` (futuro), `422`.

Validaciones por campo (se aplican solo si el campo se envía, respetando la semántica PATCH):

| Campo          | Regla                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| `firstName`    | 2-100 caracteres. Solo letras, espacios, apóstrofes, guiones y puntos. No acepta `null`. |
| `lastName`     | Idem `firstName`. No acepta `null`.                                                      |
| `documentType` | Enum cerrado: `passport` \| `dni`.                                                       |
| `documentId`   | 1-30 caracteres. Alfanumérico (`A-Z`, `a-z`, `0-9`, `-`).                                |
| `phone`        | Formato E.164 (`+573001234567`). Longitud 8-16.                                          |
| `country`      | ISO 3166-1 alpha-2 en mayúsculas. Longitud exacta 2.                                     |
| `address`      | 1-200 caracteres. Letras, dígitos, espacios y `.,-#/°`.                                  |

#### 5.2.8 Decisiones de UX

- Formulario inline en `<SectionCard>` (no modal). Sigue el patrón D8.
- Los campos de identidad (`firstName`, `lastName`, `documentType`, `documentId`) se agrupan visualmente como "Identidad" y los de contacto (`phone`, `country`, `address`) como "Contacto".
- `documentType` se renderiza como `<select>` con opciones `passport` / `dni` (etiquetas i18n).
- `country` se renderiza como `<select>` con un catálogo hardcodeado en frontend (`src/config/countries.ts` en Fase 3). No viene del backend.
- `documentType` no se valida como par obligatorio con `documentId` a nivel de schema. La regla "ambos o ninguno" la aplica la UI: si el usuario elige un tipo, se exige número; si borra el tipo, se borra el número.
- El campo `phone` reutiliza el componente `PhoneInput` de `react-phone-number-input` (ya en uso en `ContactForm.tsx`).
- Validación de cliente con Zod (`personalDataSchema`), creado en Fase 3.
- Si `identityLocked === true`, los campos de identidad quedan deshabilitados en la UI y el submit solo envía los campos de contacto modificados.

#### 5.2.9 Interacciones con otras partes del sistema

- `me { name }` (consumido por `useSidebarData` y `SidebarUserMenu`): el backend construye `name` a partir de `firstName` + `lastName`. Al actualizar cualquiera de los dos, el `name` del sidebar debe reflejar el cambio vía graphcache sin refetch. Esto implica que `updatePersonalData` debe incluir un `updates` explícito en `UrqlProvider` o que el resolver del BFF devuelva también el `User` para que graphcache normalice. Punto a resolver en Fase 3.
- `publicProfile(userId)`: no expone `documentType`, `documentId` ni `address`. Sí puede exponer `phone` si Privacy lo permite. Los cambios en `phone` deben reflejarse ahí vía graphcache.
- `CertificateEligibility`: en Fase 5, el requisito "Datos personales completos" se calculará a partir de `myPersonalData`. Qué cuenta como "completo" se define en Fase 5 (probablemente: `documentType`, `documentId`, `phone`, `country` y `address` no nulos).

### 5.3 Security

#### 5.3.1 Tipos GraphQL

```graphql
type SecuritySettings {
  email: String!
  emailVerified: Boolean!
  twoFactorEnabled: Boolean!
  twoFactorRequired: Boolean!
  sessions: [Session!]!
}

type Session {
  id: ID!
  deviceName: String
  browser: String
  ipAddress: String
  lastActiveAt: DateTime!
  current: Boolean!
}

type SecurityOperationResult {
  success: Boolean!
  message: String
}

type TwoFactorSetup {
  secret: String!
  qrCode: String!
}

input ChangePasswordInput {
  currentPassword: String!
  newPassword: String!
}

input RequestEmailChangeInput {
  newEmail: String!
}
```

Notas:

- `SecurityOperationResult.message` es informativo; la UI decide por `success` y por código de error, nunca por texto.
- `TwoFactorSetup { secret, qrCode }` contiene datos sensibles (contrato §9, regla 6): no se loggea, no se cachea, no se envía a analítica. Actualmente no se usa en UI (2FA por correo); disponible para TODO de métodos futuros.

#### 5.3.2 Queries

- `mySecuritySettings -> SecuritySettings!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/security/my-security-settings.graphql`.
- La sección se renderiza como una sola `<SectionCard>` con 5 subsecciones: Email, Contraseña, 2FA, Sesiones, Medio de verificación 2FA.

#### 5.3.3 Mutations

Siete mutaciones, ninguna devuelve entidad completa (solo `SecurityOperationResult` o `TwoFactorSetup`). Por tanto, la actualización de graphcache se hace por `updates` explícitos o por refetch puntual.

**`requestEmailChange`** — input `{ newEmail }`. El email no cambia hasta que el usuario confirma el enlace del correo de verificación. Errores:

- `409 EMAIL_TAKEN` → "Ese correo ya está registrado".
- `409 EMAIL_UNCHANGED` → "Es tu correo actual" (también pre-validado en cliente).

**`changePassword`** — input `{ currentPassword, newPassword }`. Efecto secundario: **el backend revoca todas las otras sesiones** del usuario. La UI muestra aviso "Se cerraron tus otras sesiones por seguridad" y refresca `mySecuritySettings` con `network-only`. Errores:

- `422 VALIDATION_ERROR` (reglas de `newPassword`).
- `422 INVALID_CURRENT_PASSWORD` (error en `currentPassword`).
- `409 CONFLICT` (nueva = actual).

**`beginTwoFactorSetup`** — sin input. Devuelve `{ secret, qrCode }`. Envía un código de 6 dígitos al correo del usuario. Errores:

- `409 CONFLICT` ("2FA ya activo").

**`verifyTwoFactorSetup`** — input `{ code }`. Errores:

- `422 VALIDATION_ERROR` (formato).
- `422 INVALID_CODE` (código incorrecto).
- `409 CONFLICT` (setup no iniciado o ya completado).

**`disableTwoFactor`** — input `{ code }`. Visible solo si `twoFactorRequired === false` (student). El BFF bloquea con `403 FORBIDDEN` si `session.user.role !== 'student'`, sin llamar al backend. Errores:

- `403 FORBIDDEN` (defensa en profundidad).
- `422 VALIDATION_ERROR`, `422 INVALID_CODE`.

**`revokeSession`** — input `{ sessionId }`. Errores:

- `404 NOT_FOUND` ("la sesión ya no existe").
- `409 CONFLICT` (intento de revocar la sesión actual).

**`revokeOtherSessions`** — sin input. Deja solo la sesión actual.

#### 5.3.4 Campos editables vs. solo lectura

| Campo               | Editable aquí                                        | Notas                                       |
| ------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `email`             | ✅ (vía `requestEmailChange`)                        | Cambio pendiente hasta verificar.           |
| `emailVerified`     | ❌                                                   | Solo lectura.                               |
| `twoFactorEnabled`  | ✅ (vía `verifyTwoFactorSetup` / `disableTwoFactor`) | Desactivación bloqueada para teacher/admin. |
| `twoFactorRequired` | ❌                                                   | Solo lectura. Discriminador de rol.         |
| `sessions`          | ✅ (vía `revokeSession` / `revokeOtherSessions`)     | La sesión actual no se puede revocar.       |
| `secret`, `qrCode`  | ❌ (no se exponen en UI)                             | Datos sensibles.                            |

#### 5.3.5 Restricciones por rol

- **student:** 2FA opcional. Puede activar y desactivar.
- **teacher / admin:** 2FA obligatorio desde el arranque. Puede activar, **no desactivar**.
  - El contrato lo soporta: `POST .../two-factor/disable` responde `403` cuando `twoFactorRequired: true`.
  - **Bloqueo en el BFF (Fase 4):** `disableTwoFactor` responde `403 FORBIDDEN` si `session.user.role !== 'student'`, sin llamar al backend. Primera regla de autorización por rol del BFF.

#### 5.3.6 Estados de UI a manejar

- **Loading:** primer fetch de `mySecuritySettings`.
- **Populated:** estado normal.
- **Empty (sin sesiones):** estado defensivo. La sesión actual siempre está.
- **Editing / Saving / Success / Error** por mutación (ver 5.3.3).
- **Errores comunes:**
  - `401` → "Tu sesión expiró".
  - `403` → "Acción no permitida".
  - `422` → error por campo.
  - `409` → conflicto según el caso.
  - Red/5xx → mensaje genérico con Reintentar.

#### 5.3.7 Restricciones del contrato

`PATCH`/`PUT`/`POST`/`DELETE` de Security pueden responder:

- `401 UNAUTHENTICATED`.
- `403 FORBIDDEN` (disable 2FA para teacher/admin, email-change en casos específicos).
- `404 NOT_FOUND` (revoke session inexistente).
- `409 CONFLICT` (email duplicado, email sin cambio, nueva password igual a la actual, intento de revocar la sesión actual).
- `422 VALIDATION_ERROR`, `422 INVALID_CURRENT_PASSWORD`, `422 INVALID_CODE`.

Reglas específicas:

- `newPassword`: 6-15 caracteres, 1 minúscula, 1 mayúscula, 1 especial. Mismas reglas que registro/reset.
- `code`: 6 dígitos numéricos (`/^\d{6}$/`).
- Cambio de contraseña cierra otras sesiones automáticamente.

#### 5.3.8 Decisiones de UX

- Subsecciones en `<SectionCard>`, no modales (D8).
- `<ConfirmDialog>` para `revokeSession` y `revokeOtherSessions`.
- Formularios inline para `changePassword`, `requestEmailChange`, `verifyTwoFactorSetup`, `disableTwoFactor`.
- `secret` y `qrCode` no se muestran en UI (2FA por correo).
- `confirmPassword` nunca sale del cliente.
- El campo `email` de `SecuritySettings` es la fuente de verdad del flujo de cambio de email. Para mostrar en otros lugares se usa `me { email }`.

#### 5.3.9 Interacciones con otras partes del sistema

- **Graphcache:** política global `cache-and-network`. Puntual `network-only` en el refetch de `mySecuritySettings` tras `changePassword`.
- **Clasificación por mutación:**
  - `requestEmailChange` → sin updates.
  - `changePassword` → refetch `network-only`.
  - `beginTwoFactorSetup` → sin updates.
  - `verifyTwoFactorSetup` → update explícito (`twoFactorEnabled = true`).
  - `disableTwoFactor` → update explícito (`twoFactorEnabled = false`).
  - `revokeSession` → update explícito (quitar de la lista).
  - `revokeOtherSessions` → update explícito (dejar solo current).
- **`me { email }`:** cuando el cambio de email se confirme, hay que invalidar/actualizar también `me` y `SidebarData`.
- **`auth.ts`:** TODO para 2FA en login (fuera de alcance).
- **`UrqlProvider`:** asegurar que `TwoFactorSetup` NO se declara como entidad normalizada (contiene `secret` y `qrCode`).

### 5.4 Preferences

#### 5.4.1 Tipos GraphQL

```graphql
enum Theme {
  system
  light
  dark
}

type Preferences {
  language: String!
  theme: Theme!
  timezone: String!
  notifications: NotificationPreferences!
  accessibility: AccessibilityPreferences!
}

type NotificationPreferences {
  email: Boolean!
  push: Boolean!
  inApp: Boolean!
}

type AccessibilityPreferences {
  reducedMotion: Boolean!
  highContrast: Boolean!
}

input NotificationPreferencesInput {
  email: Boolean
  push: Boolean
  inApp: Boolean
}

input AccessibilityPreferencesInput {
  reducedMotion: Boolean
  highContrast: Boolean
}

input UpdatePreferencesInput {
  language: String
  theme: Theme
  timezone: String
  notifications: NotificationPreferencesInput
  accessibility: AccessibilityPreferencesInput
}
```

Notas:

- Todos los campos de `Preferences` son obligatorios en la respuesta (`!`).
- `notifications` y `accessibility` son value objects, no entidades; graphcache los embebe en el padre.
- `language` es `String` en el schema para no acoplarlo a routing.locales. La validación vive en el BFF (ver 5.4.7).

#### 5.4.2 Queries

- `myPreferences -> Preferences!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/preferences/my-preferences.graphql`.

#### 5.4.3 Mutations

`updatePreferences(input: UpdatePreferencesInput!): Preferences!` es la única mutación y devuelve la entidad completa.

Semántica PATCH (regla general del contrato, ver `BACKEND_API.md` §9):

| Campo             | Omitido (`undefined`) | `null`                                               | Valor     |
| ----------------- | --------------------- | ---------------------------------------------------- | --------- |
| `language`        | No se modifica        | `422 VALIDATION_ERROR`                               | Se asigna |
| `theme`           | No se modifica        | `422 VALIDATION_ERROR`                               | Se asigna |
| `timezone`        | No se modifica        | `422 VALIDATION_ERROR`                               | Se asigna |
| `notifications.*` | No se modifica        | `422 VALIDATION_ERROR` si el objeto entero es `null` | Se asigna |
| `accessibility.*` | No se modifica        | `422 VALIDATION_ERROR` si el objeto entero es `null` | Se asigna |

Excepción: en Preferences `null` se rechaza con `422` porque ningún campo tiene estado vacío válido. `notifications: {}` equivale a omitir el campo.

#### 5.4.4 Campos editables vs. solo lectura

| Campo                         | Editable aquí | Notas                                    |
| ----------------------------- | ------------- | ---------------------------------------- |
| `language`                    | ✅            | `es` o `en`.                             |
| `theme`                       | ✅            | `system`, `light` o `dark`.              |
| `timezone`                    | ✅            | Zona IANA, por ejemplo `America/Bogota`. |
| `notifications.email`         | ✅            | Boolean.                                 |
| `notifications.push`          | ✅            | Boolean.                                 |
| `notifications.inApp`         | ✅            | Boolean.                                 |
| `accessibility.reducedMotion` | ✅            | Boolean.                                 |
| `accessibility.highContrast`  | ✅            | Boolean.                                 |

#### 5.4.5 Restricciones por rol

Universal: `student`, `teacher`, `admin`.

#### 5.4.6 Estados de UI a manejar

- Loading, Populated, Editing, Saving, Success y Error.
- `422 VALIDATION_ERROR` para idioma, tema, timezone inválidos o `null`.
- `401 UNAUTHENTICATED` para problemas de token.

#### 5.4.7 Restricciones del contrato

`PATCH /users/me/preferences` responde `401` o `422`.

| Campo           | Regla                                             |
| --------------- | ------------------------------------------------- |
| `language`      | `es` o `en`; otro valor → `422`.                  |
| `theme`         | `system`, `light` o `dark`.                       |
| `timezone`      | Zona IANA válida.                                 |
| `notifications` | Objeto parcial; `{}` no modifica; `null` → `422`. |
| `accessibility` | Objeto parcial; `{}` no modifica; `null` → `422`. |

El BFF valida `null`, `language` y normaliza antes de llamar al backend. El mock replica la validación en runtime.

#### 5.4.8 Decisiones de UX (pendientes)

La UI se implementa en Fase 3. El formulario será inline en `<SectionCard>`, sin cambios de comportamiento para los toggles actuales. Los TODO de flash/sync quedan documentados en §8.1.

#### 5.4.9 Interacciones con otras partes del sistema

- `UrqlProvider`: `Preferences: () => 'me'` ya existe.
- `LanguageToggle` y `ThemeToggle`: sin cambios en esta fase; TODOs en §8.1.
- `timezone`: solo se persiste; TODO `tz-global` para Fase 6+.

### 5.5 Privacy

#### 5.5.1 Tipos GraphQL

```graphql
enum ProfileVisibility {
  everyone
  authenticated
  nobody
}

type PrivacySettings {
  profileVisibility: ProfileVisibility!
  emailVisibility: ProfileVisibility!
  phoneVisibility: ProfileVisibility!
  allowDirectMessages: Boolean!
}

input UpdatePrivacySettingsInput {
  profileVisibility: ProfileVisibility
  emailVisibility: ProfileVisibility
  phoneVisibility: ProfileVisibility
  allowDirectMessages: Boolean
}
```

Notas:

- `PrivacySettings` es singleton (`PrivacySettings: () => 'me'` en `UrqlProvider`).
- `allowDirectMessages` se expone también en `PublicProfile` (ver 5.5.9 y 8.2.18).

#### 5.5.2 Queries

- `myPrivacySettings -> PrivacySettings!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/privacy/my-privacy-settings.graphql`.

#### 5.5.3 Mutations

`updatePrivacySettings(input: UpdatePrivacySettingsInput!): PrivacySettings!` — única mutación. Devuelve la entidad completa (D7).

Semántica PATCH (regla general del contrato, ver `BACKEND_API.md` §9):

| Campo                 | Omitido (`undefined`) | `null`                 | Valor     |
| --------------------- | --------------------- | ---------------------- | --------- |
| `profileVisibility`   | No se modifica        | `422 VALIDATION_ERROR` | Se asigna |
| `emailVisibility`     | No se modifica        | `422 VALIDATION_ERROR` | Se asigna |
| `phoneVisibility`     | No se modifica        | `422 VALIDATION_ERROR` | Se asigna |
| `allowDirectMessages` | No se modifica        | `422 VALIDATION_ERROR` | Se asigna |

Excepción: en Privacy `null` se rechaza con `422` porque ningún campo tiene estado vacío válido (mismo criterio que Preferences, ver 8.2.18).

#### 5.5.4 Campos editables vs. solo lectura

| Campo                 | Editable aquí | Notas                                      |
| --------------------- | ------------- | ------------------------------------------ |
| `profileVisibility`   | ✅            | `everyone` \| `authenticated` \| `nobody`. |
| `emailVisibility`     | ✅            | `everyone` \| `authenticated` \| `nobody`. |
| `phoneVisibility`     | ✅            | `everyone` \| `authenticated` \| `nobody`. |
| `allowDirectMessages` | ✅            | Boolean.                                   |

#### 5.5.5 Restricciones por rol

Universal: student, teacher, admin.

#### 5.5.6 Estados de UI a manejar

- Loading, Populated, Editing, Saving, Success y Error.
- `422 VALIDATION_ERROR` para valores inválidos o `null`.
- `401 UNAUTHENTICATED` para problemas de token.

#### 5.5.7 Restricciones del contrato

`PATCH /users/me/privacy` responde `401` o `422`.

| Campo                 | Regla                                                   |
| --------------------- | ------------------------------------------------------- |
| `profileVisibility`   | Enum cerrado `everyone` \| `authenticated` \| `nobody`. |
| `emailVisibility`     | Ídem.                                                   |
| `phoneVisibility`     | Ídem.                                                   |
| `allowDirectMessages` | Boolean. `null` → `422`.                                |

#### 5.5.8 Decisiones de UX

- Formulario inline en `<SectionCard>` (D8).
- Cada control de visibilidad se renderiza como `<select>` con las 3 opciones (etiquetas i18n).
- `allowDirectMessages` como toggle.
- Validación de cliente con Zod (`privacySchema`), creado en Fase 3.

#### 5.5.9 Interacciones con otras partes del sistema

- `publicProfile(userId)`: aplica la matriz de visibilidad documentada en §3.5 del contrato. Si el solicitante no cumple `profileVisibility`, el backend responde `404` y el BFF devuelve `null`.
- `publicProfile.allowDirectMessages`: expuesto para que otros usuarios sepan si pueden escribir. Se agrega al schema (ver 8.2.18).
- `UrqlProvider`: `PrivacySettings: () => 'me'` ya existe.

### 5.6 Account

#### 5.6.1 Tipos GraphQL

```graphql
enum AccountStatus {
  active
  pending_deactivation
  suspended
  inactive
}

type Account {
  status: AccountStatus!
  deactivationScheduledAt: DateTime
}
```

Notas:

- `Account` es singleton (`Account: () => 'me'` en `UrqlProvider`).
- `suspended` e `inactive` no son asignables desde User Settings. Los asigna el backend (admin o proceso automático tras el período de gracia).
- `deactivationScheduledAt` es fecha ISO 8601 o `null`.

#### 5.6.2 Queries

- `myAccount -> Account!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/account/my-account.graphql`.

#### 5.6.3 Mutations

- `requestAccountDeactivation: Account!` — pasa la cuenta a `pending_deactivation`. Errores: `409 CONFLICT` (la cuenta no está `active`), `403 FORBIDDEN` (teacher/admin).
- `cancelAccountDeactivation: Account!` — vuelve la cuenta a `active`. Errores: `409 CONFLICT` (la cuenta no está `pending_deactivation`), `403 FORBIDDEN` (teacher/admin).

Ambas devuelven la entidad completa (D7).

#### 5.6.4 Campos editables vs. solo lectura

| Campo                     | Editable aquí | Notas                                                 |
| ------------------------- | ------------- | ----------------------------------------------------- |
| `status`                  | ❌            | Solo lectura.                                         |
| `deactivationScheduledAt` | ❌            | Solo lectura. Se muestra con fecha exacta localizada. |

#### 5.6.5 Restricciones por rol

- **student:** puede solicitar y cancelar la desactivación.
- **teacher / admin:** `403 FORBIDDEN` en ambas mutations. El BFF bloquea sin llamar al backend. La sección no se renderiza para estos roles (D3).

#### 5.6.6 Estados de UI a manejar

- **Loading:** primer fetch de `myAccount`.
- **Active:** estado normal. Se muestra botón "Solicitar desactivación" con confirmación fuerte (`<ConfirmDialog>`).
- **Pending deactivation:** se muestra `deactivationScheduledAt` con fecha exacta localizada + botón "Cancelar desactivación".
- **Suspended / Inactive:** mensaje informativo, sin acciones.
- **Error:**
  - `409 CONFLICT` → mensaje específico según el estado.
  - `403 FORBIDDEN` → "Acción no permitida".
  - `401` → "Tu sesión expiró".

#### 5.6.7 Restricciones del contrato

- `POST /users/me/account/deactivation` → `401`, `403` (teacher/admin), `409` (no está `active`).
- `DELETE /users/me/account/deactivation` → `401`, `403` (teacher/admin), `409` (no está `pending_deactivation`).

#### 5.6.8 Decisiones de UX

- `<ConfirmDialog>` para ambas acciones (son destructivas/inversas de destructivas). Sigue D8.
- `deactivationScheduledAt` se muestra con fecha exacta localizada. El usuario necesita saber cuándo para poder cancelar a tiempo.
- La sección solo se renderiza para student.

#### 5.6.9 Interacciones con otras partes del sistema

- `UrqlProvider`: `Account: () => 'me'` ya existe.
- `SidebarData` consume `myAccount.status` para el estado de la cuenta. El cambio de estado debe reflejarse vía graphcache sin refetch.
- Al pasar a `pending_deactivation`, el usuario sigue con acceso hasta la fecha de desactivación. La UI del dashboard no cambia de comportamiento hasta entonces.

### 5.7 Courses

#### 5.7.1 Tipos GraphQL

```graphql
enum CourseEnrollmentStatus {
  active
  completed
  paused
}

type CourseEnrollment {
  courseId: ID!
  title: String!
  progress: Float!
  status: CourseEnrollmentStatus!
  enrolledAt: DateTime!
  completedAt: DateTime
}
```

Notas:

- `CourseEnrollment` no tiene `id` propio; su identificador natural es `courseId`.
- `progress` es `Float` en rango `[0.0, 1.0]` (`0.65` = 65%).
- `status: paused` lo asigna otro módulo (Courses o Learning Paths), no User Settings.

#### 5.7.2 Queries

- `myCourses -> [CourseEnrollment!]!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/courses/my-courses.graphql`.

#### 5.7.3 Mutations

Ninguna. Sección de solo lectura.

#### 5.7.4 Campos editables vs. solo lectura

| Campo                                                                  | Editable aquí | Notas         |
| ---------------------------------------------------------------------- | ------------- | ------------- |
| `courseId`, `title`, `progress`, `status`, `enrolledAt`, `completedAt` | ❌            | Solo lectura. |

#### 5.7.5 Restricciones por rol

- **student:** acceso.
- **teacher / admin:** `403 FORBIDDEN`. El BFF bloquea sin llamar al backend.

#### 5.7.6 Estados de UI a manejar

- **Loading:** primer fetch de `myCourses`.
- **Populated:** lista de cursos con título, progreso y estado.
- **Empty:** sin cursos inscritos. Mensaje informativo.
- **Error:** `401` → "Tu sesión expiró"; `403` → "Acción no permitida".

#### 5.7.7 Restricciones del contrato

`GET /users/me/courses` → `401`, `403` (teacher/admin).

#### 5.7.8 Decisiones de UX

- Solo lectura. La sección muestra un resumen: título, progreso y estado por curso.
- Click en un curso navega a la sección Courses del dashboard (fuera de User Settings). No hay acciones inline.
- Barra de progreso visual a partir de `progress` en `[0, 1]`.

#### 5.7.9 Interacciones con otras partes del sistema

- `UrqlProvider`: `CourseEnrollment: (data) => data.courseId as string` en keys. La entidad se normaliza por `courseId`.
- El progreso que se muestra aquí es informativo. La fuente de verdad del progreso vive en el módulo Courses.

**Estado (2026-10-18):** la key `CourseEnrollment: (data) => data.courseId`
en `UrqlProvider` **queda diferida a Fase 5.2**, cuando se construya
`CoursesSection`. Hoy la query `myCourses` funciona sin normalización.

### 5.8 Certificates

#### 5.8.1 Tipos GraphQL

```graphql
type Certificate {
  id: ID!
  courseId: ID!
  courseTitle: String!
  certificateNumber: String!
  issuedAt: DateTime!
  downloadUrl: String!
}
```

Notas:

- `downloadUrl` es `String!` (siempre presente). El backend debe generar una URL firmada con expiración.
- `CertificateEligibility` (componente existente) es independiente de `myCertificates`: valida requisitos para generar certificados, no para ver los ya emitidos.

#### 5.8.2 Queries

- `myCertificates -> [Certificate!]!` (fuente de datos de esta sección). Operation existente: `src/graphql/operations/certificates/my-certificates.graphql`.

#### 5.8.3 Mutations

Ninguna. Sección de solo lectura + descarga.

#### 5.8.4 Campos editables vs. solo lectura

| Campo                                                                           | Editable aquí | Notas         |
| ------------------------------------------------------------------------------- | ------------- | ------------- |
| `id`, `courseId`, `courseTitle`, `certificateNumber`, `issuedAt`, `downloadUrl` | ❌            | Solo lectura. |

#### 5.8.5 Restricciones por rol

- **student:** acceso.
- **teacher / admin:** `403 FORBIDDEN`. El BFF bloquea sin llamar al backend.

#### 5.8.6 Estados de UI a manejar

- **Loading:** primer fetch de `myCertificates`.
- **Populated:** lista de certificados con link de ver/descargar.
- **Empty:** sin certificados emitidos. Mensaje informativo ("aún no tienes certificados").
- **Error:** `401` → "Tu sesión expiró"; `403` → "Acción no permitida".

#### 5.8.7 Restricciones del contrato

`GET /users/me/certificates` → `401`, `403` (teacher/admin).

#### 5.8.8 Decisiones de UX

- Si existe al menos un certificado → se lista con link de ver/descargar (`downloadUrl`).
- Si no existe ninguno → estado vacío informativo. No hay filtros por estado: el certificado existe o no.
- `CertificateEligibility` es informativo: muestra qué requisitos faltan (avatar, datos personales, verificación). Bloquea la generación de certificados, no la visualización de los ya emitidos.
- `downloadUrl` se abre en nueva pestaña. La UI no cachea la URL.

#### 5.8.9 Interacciones con otras partes del sistema

- `UrqlProvider`: `Certificate: (data) => data.id as string` en keys. La entidad se normaliza por `id`.
- `CertificateEligibility` (existente en `user-settings/CertificateEligibility.tsx`): se mantiene como componente informativo. Se vincula con `myPersonalData` y `mySecuritySettings` para calcular los requisitos (Fase 5).

**Estado (2026-10-18):** la key `Certificate: (data) => data.id` en
`UrqlProvider` **queda diferida a Fase 5.3**, cuando se construya
`CertificatesSection`. Hoy la query `myCertificates` funciona sin
normalización.

### 5.9 Billing

#### 5.9.1 Tipos GraphQL

```graphql
enum SubscriptionPlan {
  free
  premium
  enterprise
}

enum SubscriptionStatus {
  trialing
  active
  past_due
  canceled
  expired
}

type UserSubscription {
  id: ID!
  plan: SubscriptionPlan!
  status: SubscriptionStatus!
  startedAt: DateTime!
  currentPeriodEnd: DateTime
  cancelAtPeriodEnd: Boolean!
}

type PaymentMethod {
  id: ID!
  brand: String
  last4: String
  expirationMonth: Int
  expirationYear: Int
}

enum InvoiceStatus {
  draft
  open
  paid
  void
  uncollectible
}

type Invoice {
  id: ID!
  number: String!
  amount: Int!
  currency: String!
  status: InvoiceStatus!
  issuedAt: DateTime!
  downloadUrl: String
}
```

Notas:

- `mySubscription` puede ser `null` (usuario sin suscripción).
- `amount` es `Int!` en la unidad menor de la moneda (contrato §7).
- `downloadUrl` de `Invoice` es nullable.

#### 5.9.2 Queries

- `mySubscription -> UserSubscription | null` — operation existente: `src/graphql/operations/billing/my-subscription.graphql`.
- `myPaymentMethods -> [PaymentMethod!]!` — operation existente: `src/graphql/operations/billing/my-payment-methods.graphql`.
- `myInvoices -> [Invoice!]!` — operation existente: `src/graphql/operations/billing/my-invoices.graphql`.

#### 5.9.3 Mutations

- `changeSubscriptionPlan(plan: SubscriptionPlan!): UserSubscription!` — devuelve la suscripción completa (D7).
  - Upgrade inmediato, downgrade a fin de período (decisión D-B3). `free → premium` aplica al instante; `premium → free` se aplica en `currentPeriodEnd`.
  - Errores: `403` (enterprise), `409` (mismo plan o `PAYMENT_METHOD_REQUIRED`), `422`.
- `cancelSubscription: UserSubscription!` — devuelve la suscripción completa (D7).
  - Detiene cobros futuros, mantiene acceso hasta `currentPeriodEnd`. Setea `cancelAtPeriodEnd: true`, `status: 'active'` hasta el fin del período, luego `canceled`/`expired`.
  - Errores: `404` (sin suscripción), `409` (ya cancelada).
- `removePaymentMethod(paymentMethodId: ID!): Boolean!` — devuelve `Boolean`.
  - Rompe D7: no devuelve entidad. La actualización de graphcache se hace por `updates` explícito en `UrqlProvider`.
  - Errores: `404` (método no existe), `409` (último método de suscripción premium `active`).

#### 5.9.4 Campos editables vs. solo lectura

| Campo              | Editable aquí                                          | Notas                          |
| ------------------ | ------------------------------------------------------ | ------------------------------ |
| `mySubscription`   | ✅ vía `changeSubscriptionPlan` / `cancelSubscription` | `null` si no hay suscripción.  |
| `myPaymentMethods` | ✅ vía `removePaymentMethod`                           | Lista con `updates` explícito. |
| `myInvoices`       | ❌                                                     | Solo lectura.                  |

#### 5.9.5 Restricciones por rol

- **student:** acceso completo.
- **teacher / admin:** `403 FORBIDDEN` en todas las queries y mutations. El BFF bloquea sin llamar al backend.

#### 5.9.6 Estados de UI a manejar

- **Loading:** primer fetch de cada query.
- **Subscription:**
  - `null` → estado vacío informativo ("sin suscripción activa").
  - `active` → muestra plan, fecha de renovación, botón "Cancelar suscripción".
  - `cancelAtPeriodEnd: true` → muestra "tu suscripción se cancelará el {fecha}" + botón "Reactivar" (opcional, si el backend lo soporta).
  - `canceled` / `expired` → estado informativo.
- **Payment methods:**
  - Lista con `brand`, `last4`, expiración. Acción "Eliminar" con `<ConfirmDialog>`.
  - Empty → mensaje informativo.
- **Invoices:**
  - Lista con número, monto, fecha, estado. Link de descarga si `downloadUrl`.
  - Empty → mensaje informativo.
- **Error:** `409` con `PAYMENT_METHOD_REQUIRED` → "necesitas un método de pago para cambiar a premium".

#### 5.9.7 Restricciones del contrato

- `PUT /users/me/subscription/plan` → `403`, `409` (incluye `PAYMENT_METHOD_REQUIRED`), `422`.
- `POST /users/me/subscription/cancellation` → `404`, `409`.
- `DELETE /users/me/payment-methods/:id` → `404`, `409`.
- Todas las queries → `403` (teacher/admin).

#### 5.9.8 Decisiones de UX

- Formularios inline en `<SectionCard>` (D8). `<ConfirmDialog>` para cancelar suscripción y eliminar método de pago.
- `changeSubscriptionPlan`: dropdown de planes con confirmación. Enterprise no se ofrece (contrato §6).
- `cancelSubscription`: `<ConfirmDialog>` con aviso "Mantendrás acceso hasta {currentPeriodEnd}".
- `removePaymentMethod`: `<ConfirmDialog>` con aviso específico si es el único método de una suscripción premium activa (pero el backend ya responde `409`, así que la UI lo pre-valida).

#### 5.9.9 Interacciones con otras partes del sistema

- `UrqlProvider`: `UserSubscription: (data) => data.id as string`, `PaymentMethod: (data) => data.id as string`, `Invoice: (data) => data.id as string` en keys.

  **Estado (2026-10-18):** la key `UserSubscription` ya existe en
  `UrqlProvider`. Las keys `PaymentMethod` e `Invoice` **quedan diferidas a
  Fase 5.4**, cuando se construya `BillingSection`. Hoy `myPaymentMethods` y
  `myInvoices` funcionan sin normalización.

- `removePaymentMethod` incluye `updates` explícito en `UrqlProvider` para quitar el método de `myPaymentMethods` (ver 8.2.23).
- `SidebarData` consume `mySubscription.plan` para el `PlanCard`. El cambio de plan debe reflejarse vía graphcache sin refetch.
- Al cancelar (`cancelAtPeriodEnd: true`), el `PlanCard` sigue mostrando el plan actual hasta el fin del período.

---

## 6. Fases y subtareas

### Fase 0 — Decisiones y fundaciones

- [x] **0.1** Definir el patrón de mutación + refresco. → D7.
- [x] **0.2** Definir el patrón de modales de confirmación. → D8.
- [x] **0.3** Analizar el schema GraphQL sección por sección y volcar las
      conclusiones en la sección 5 de este documento. _(9/9 cerradas:
      Profile, Personal Data, Security, Preferences, Privacy, Account,
      Courses, Certificates y Billing)_

      **Implementación en código:** se completó el 2026-10-18 con los commits:

      - `feat(personal-data): agregar documentType y validaciones de entrada`
      - `fix(bff): propagar códigos de BackendOperationError a GraphQL y
        endurecer mock`
      - `test(bff): cubrir validaciones de Personal Data y semántica de
        Security en mock`

      Estado: `pnpm type-check`, `pnpm graphql:validate` y
      `pnpm mock:test` (59/59) en verde. `pnpm lint` con los 4 errores
      preexistentes de §10.1.

- [x] **0.4** Analizar el contrato `BACKEND_API.md` para detectar discrepancias
      o necesidades de ajuste (ver sección 8). _(análisis completo para las
      9 secciones)_
- [x] **0.5** Actualizar el contrato `BACKEND_API.md` con los ajustes acordados.
      _(Profile, Personal Data, Security, Preferences, Privacy, Account,
      Courses, Certificates y Billing aplicados)_
- [x] **0.6** Reorganizar los schemas Zod y los códigos de error en carpetas
      modulares. **Cerrada e implementada en código el 2026-10-19** (commit
      `refactor(schemas): reorganizar schemas Zod y códigos de error por dominio`).

  Resultado:

  - `src/lib/schemas/primitives.ts` — fuente única de verdad de las reglas
    del contrato v1.3 (longitudes, regex, helpers, catálogos). Incluye los 5
    gaps cerrados: `language`, `theme`, `image`, `plan`, `normalizeEmail`.
  - `src/lib/schemas/fields/auth.ts` — fragmentos Zod reutilizables.
  - `src/lib/schemas/auth/{login,register,forgot-password,reset-password}.schema.ts`.
  - `src/lib/schemas/contact/contact.schema.ts` (`contactNumber` alineado a
    E.164 estricto, coherente con contrato §3.4 y mock).
  - `src/lib/schemas/index.ts` — re-exports públicos.
  - `src/lib/errors/{api,auth,contact}-errors.ts` organizados por dominio.
  - `src/lib/errors/index.ts` — re-exports públicos.
  - Eliminados los 5 archivos viejos: `user.schema.ts`, `contactSchema.ts`,
    `apiErrors.ts`, `authErrors.ts`, `contactErrors.ts`.
  - 13 consumidores migrados.
  - `pnpm type-check`, `pnpm lint`, `pnpm mock:test` (59/59) en verde.

**Commits de la fase:**

- `docs(user-settings): add plan and initial decisions`
- `feat(contract): add validation rules and nullable bio fields for profile`
- `docs(user-settings): close phase 0.3 analysis for profile section`

---

### Fase 1 — Autorización por rol en el BFF ✅ CERRADA

Implementada y commiteada el **2026-10-19** en el commit
`3d03535 feat(bff): aplicar autorización por rol en queries y mutations de settings`.

- [x] **1.1** Helper `requireRole(context, allowedRoles)` en
      `src/graphql/auth.ts`. Lanza `GraphQLError` con
      `extensions.code = 'FORBIDDEN'` y `status: 403`.
- [x] **1.2** Aplicado en `account.ts` (mutations), `courses.ts`,
      `certificates.ts`, `billing.ts`, `security.ts` (`disableTwoFactor`).
      `myAccount` y el resto de Security siguen con `requireAuth`.
- [x] **1.3** Visibilidad del orquestador (`page.tsx`) alineada con la
      autorización real del BFF.
- [x] **1.4** `src/graphql/context.ts` documentado (sin TODO).
- [x] **1.5** 11 `authTests` en `scripts/test-mock.ts` (student/teacher/admin
      en Courses, Certificates, Subscription, Account, disableTwoFactor).
- [x] **1.6** `pnpm mock:test` 59/59 PASS (26 tests genéricos + 8 public API + 11 auth + 14 behavior de Personal Data y Security).

---

### Fase 1.7 — Limpieza de lint preexistente (BLOQUEANTE)

> **Motivo.** Al instalar TypeScript 6/7 side-by-side, ESLint quedó
> temporalmente en un estado inconsistente y acumuló problemas que no
> estaban clasificados. Al reactivarlo aparecen **34 problemas (4 errors,
> 30 warnings)**, todos ajenos a User Settings. Se resuelven antes de
> arrancar Fase 2 para no arrastrar ruido en cada validación de la fase
> siguiente.

- [x] **1.7.1** Ejecutar `pnpm lint` y volcar el listado completo de
      problemas a un archivo temporal (`lint-before.txt`).
- [x] **1.7.2** Ejecutar `pnpm lint --fix` y volcar el resultado a
      `lint-after-fix.txt`.
- [x] **1.7.3** Resolver manualmente los 4 errores (`react-hooks/set-state-in-effect`
      y `react-hooks/incompatible-library`) que `--fix` no puede tocar.
- [x] **1.7.4** Resolver los warnings restantes (variables no usadas,
      `eslint-disable` obsoletos, `<img>` en lugar de `next/image`).
- [x] **1.7.5** Validar `pnpm type-check` (exit 0), `pnpm lint` (exit 0),
      `pnpm mock:test` (59/59).

**Resultado esperado:** estado base limpio, sin errores ni warnings de ESLint.

**Commit sugerido:** `chore(lint): resolve preexisting eslint errors and warnings`

---

### Fase 1.8 — Modular `docs/BACKEND_API.md` (BLOQUEANTE para Fase 3+)

> **Motivo.** `docs/BACKEND_API.md` tiene 1.471 líneas. Es difícil de
> navegar, de revisar y de mantener. Antes de que las fases 3–5 empiecen a
> consultarlo intensivamente, se divide en archivos por dominio, con un
> índice raíz. El contrato se mantiene formalmente igual; solo cambia su
> organización física.

- [x] **1.8.1** Definir la estructura de directorios (ver más abajo).
- [x] **1.8.2** Crear `docs/backend-api/README.md` como índice.
- [x] **1.8.3** Mover secciones del archivo actual a los nuevos archivos,
      sin cambiar contenido.
- [x] **1.8.4** Verificar referencias cruzadas en código y en `docs/user-settings-plan.md`.
- [x] **1.8.5** Eliminar `docs/BACKEND_API.md` (sin stub). El punto de entrada
      único es `docs/backend-api/README.md`.
- [x] **1.8.6** Validar el resultado.

Estructura objetivo:

```text
docs/backend-api/
  README.md                        (índice + encabezado legal)
  01-convenciones.md               (§1, §2, §9 transversales, §12)
  02-endpoints-publicos.md         (§3.4)
  03-usuarios.md                   (§3.5 partial, §3.6, §3.7, §3.9)
  04-security.md                   (§3.5 partial, §3.8)
  05-preferencias.md               (§8)
  06-cuenta.md                     (§5 sin Courses ni Certificates)
  07-cursos-certificados.md        (§5 Courses + Certificates)
  08-suscripcion-billing.md        (§6, §7)
  09-errores.md                    (§4, §11)
  10-regex-referencia.md           (§15)
  11-migracion.md                  (§14, histórico)
  12-historial-cambios.md          (§13, histórico)
  13-resumen-endpoints.md          (§10)

Ver detalle de la división exacta en la Parte 2.
```

**Commit sugerido:** `docs(contract): modularize BACKEND_API.md into docs/backend-api/`

---

### Fase 2 — Infraestructura UI compartida ✅ CERRADA

Implementada y commiteada el **2026-10-24** en el commit
`feat(user-settings): add shared UI primitives`.

Decisiones arquitectónicas fijadas para esta fase (ver `Rol y propósito.txt`):

- **D-A (A1):** `<SectionCard>` es Server Component por defecto. Sin estado
  propio; los casos con estado se encapsulan en subcomponentes Client.
- **D-B (B1):** `useSectionMutation` es un wrapper de `useMutation` de URQL.
  No hace optimismo de caché; expone `isSaving`, `errorCode`, `resetError`
  y llama `onSuccess`. La caché se actualiza por normalización (entidades
  con `id`) o por `updates` explícito en `UrqlProvider` (Boolean /
  `SecurityOperationResult`).
- **D-C (C2):** `<ConfirmDialog>` usa `<dialog>` nativo (`showModal()` /
  `close()`) con estilos Tailwind. Focus trap, Escape, restauración de foco
  y `aria-modal` vienen del navegador. Animación de entrada/salida con CSS +
  `prefers-reduced-motion`, sin framer-motion.

Orden de implementación aprobado (un archivo a la vez, con
`pnpm type-check` + `pnpm lint` entre cada uno):

- [x] **2.1** `src/config/user-settings-sections.ts` — mapa sección × rol.
- [x] **2.2** `src/components/ui/SectionCard.tsx`.
- [x] **2.3** `src/components/ui/SettingsSkeleton.tsx`.
- [x] **2.4** `src/components/ui/ConfirmDialog.tsx`.
- [x] **2.5** `src/hooks/useSectionMutation.ts`.
- [x] **2.6** `pnpm mock:test` (59/59) al final de la fase.

**Commit (cerrado el 2026-10-24):**
`feat(user-settings): add shared UI primitives`

---

### Fase 3 — Secciones universales (parte 1) ✅ CERRADA

> **Estado 2026-10-26:** Fase 3 **completa**. Sub-fase 1 (`countries.ts`), sub-fase 2 (4 schemas Zod + barrel + §10.5), sub-fase 3 (i18n), pasos 4–5 (`PersonalDataSection` y `PreferencesSection`), paso 6 (`PrivacySection`), paso 7 (`ProfileSection` refactor) y paso 8 (`page.tsx` → `getVisibleSections`), todos cerrados y commiteados. Orden seguido según **D-H**: `ProfileSection` al final del bloque, antes del orquestador.

**Sub-fases de i18n (cerradas):**

- [x] **3.i18n.1** `countries.ts` + 4 schemas Zod + barrel + §10.5 del plan. Commits `feat(user-settings): agregar catálogo ISO 3166-1 de países` y `feat(user-settings): agregar schemas Zod de las secciones universales`.
- [x] **3.i18n.2** Claves de `personalData`. Commit `feat(i18n): agregar claves de datos personales y limpiar claves muertas`.
- [x] **3.i18n.3** Claves de `preferences`, `privacy` y `profile`. Commit `feat(i18n): agregar claves de preferencias, privacidad y perfil`.

**Construcción de componentes (en curso, un archivo a la vez con `pnpm type-check` + `pnpm lint` entre cada uno):**

- [x] **3.1** `PersonalDataSection`: `myPersonalData` + `updatePersonalData`.
  - [x] **3.1.a** Decisión D-E: **Plan B elegido**. `PersonalData` no tiene `id` en el contrato REST, así que Plan A no era viable sin tocar contrato. Se lee `me.id` de la caché de `SidebarData`.
  - [x] **3.1.b** `PersonalDataSection.tsx` (Server) + `PersonalDataFormClient.tsx` (Client).
  - [x] **3.1.c** `updates.Mutation.updatePersonalData` en `UrqlProvider`.
  - [x] **3.1.d** Manejo de `identityLocked`, `VALIDATION_ERROR`, `FORBIDDEN`, `CONFLICT`. `superRefine` de pareja `documentType`/`documentId` en `personalDataSchema`.
  - [x] **3.1.e** `pnpm type-check` + `pnpm lint` + `pnpm mock:test` (59/59) en verde.
  - **Commits:** `2d3e79b feat(user-settings): actualizar sidebar al cambiar datos personales` + `4e94f4a feat(user-settings): agregar sección de datos personales`.
- [x] **3.2** `PreferencesSection`: `myPreferences` + `updatePreferences`.
  - [x] `language`: guardar en backend + `router.replace(pathname, { locale })` en `onSuccess`.
  - [x] `theme`: guardar en backend + `setTheme` en `onSuccess`.
  - [x] `timezone`: `<input type="text">` libre con validación Zod. `TODO(timezone-select)` anotado en §10.6.
  - [x] `null` en cualquier campo rechazado con `422` (ver 8.2.16).
  - [x] `notifications: {}` no modifica ningún subcampo.
  - [x] Los toggles (`LanguageToggle`, `ThemeToggle`) no se tocan en esta fase. TODO(theme-no-flash) y TODO(i18n-sync) en §8.1.
  - [x] `mapError` sin `FORBIDDEN`/`CONFLICT` (no aplican en Preferences según §8.2.16).
  - [x] `pnpm type-check` + `pnpm lint` + `pnpm mock:test` (59/59) + test manual en navegador (6/7 OK; timezone diferido).
  - **Commits:** `feat(i18n): agregar títulos de fieldset en preferencias` + `feat(user-settings): agregar sección de preferencias` + `feat(user-settings): integrar secciones de datos personales y preferencias`.
- [x] **3.3** `PrivacySection`: `myPrivacySettings` + `updatePrivacySettings`.
  - Decisión D-O: `PrivacySection` + `PrivacyFormClient`, patrón idéntico a Personal Data y Preferences.
  - `mapError` limitado a `VALIDATION_ERROR` e `INTERNAL_ERROR` (el contrato §8.2.18 no define otros para este endpoint).
  - PATCH diferencial estricto contra `initialValuesRef`. Nunca se envía `null`.
  - `defaultValues` vacío (`{}`) hasta que la query resuelve, para no mostrar valores sintéticos en los selects.
  - Validado: `pnpm type-check` (0), `pnpm lint` (0), `pnpm mock:test` (59/59).
  - **Commit:** `feat(user-settings): agregar sección de privacidad` (aplicado sobre `774efab`).
- [x] **3.4** `ProfileSection` + `ProfileAvatarSettings.tsx` (refactor). **Cerrado según D-H.**
  - `ProfileSection.tsx` reescrito como Server Component. Obtiene traducciones con `getTranslations`. Simplifica las props de `page.tsx` a solo `showCertificates`.
  - `ProfileFormClient.tsx` nuevo (bio + `interests`): `useSectionMutation` + `profileSchema`, PATCH diferencial anidado para `bio`, `InterestsField` inline (chips con `setFieldValue`, sin `useFieldArray`).
  - `ProfileAvatarSettings.tsx` refactorizado: deriva `image` de `useSidebarData()`, migra a `useSectionMutation`, elimina `set-state-in-effect` y `router.refresh()`. Fallbacks `fallbackName`/`fallbackEmail` migrados de `pageMessages` a `avatarMessages`.
  - `CertificateEligibility.tsx` convertido a Client Component (mínimo) con `useSidebarData()` para `hasAvatar`; JSX y lógica sin cambios.
  - Salda las deudas §10.1 de `ProfileAvatarSettings` (ver §10.1 actualizada abajo).
  - Validado: `pnpm type-check` (0), `pnpm lint` (0), `pnpm mock:test` (59/59).
  - **Commit:** `feat(user-settings): refactorizar perfil sobre primitivas compartidas` (`d3dd484`).
- [x] **3.5** `page.tsx`: migrar a `getVisibleSections(role)`. **Cerrado.**
  - `page.tsx` calcula `sections = getVisibleSections(role)` y renderiza con `sections.map` + `<Fragment key={id}>`.
  - Nuevo `renderSection(id, showCertificates)`: función módulo con `switch` que mapea cada `UserSettingsSectionId` a su componente. Los `case`s de Fases 4 y 5 devuelven `null`.
  - Eliminados `showSubscription`, `showCourses` y los 3 placeholders JSX.
  - `showCertificates` se deriva de `sections.includes('certificates')` (no hardcodeado como `role === 'student'`).
  - **Corrige bug de Fase 2:** `showCourses = student || teacher` mostraba el placeholder de Courses a teacher. Con `getVisibleSections`, teacher no lo ve (la fuente de verdad `USER_SETTINGS_SECTIONS.courses.roles = ['student']` es la que manda).
  - Validado: `pnpm type-check` (0), `pnpm lint` (0), `pnpm mock:test` (59/59).
  - **Commit:** `refactor(user-settings): migrar orquestador a mapa sección × rol`.

---

### Fase 4 — Security ✅ CERRADA (salvo 4.6)

- [x] **4.1** `SecuritySection` + `SecurityOverviewClient`: `mySecuritySettings` (lectura). Contenedor que centraliza `useQuery` y expone `refetchSecurity` (network-only) a los subcomponentes.
- [x] **4.2** `ChangePasswordSection`: `changePassword` + `confirmPassword` (cliente-only) + `refetchSecurity` tras éxito.
- [x] **4.3** `EmailChangeSection`: `requestEmailChange` con schema dinámico (refine "es tu correo actual"). Sin refetch tras éxito (contrato §3.8: el email no cambia hasta confirmar el enlace).
- [x] **4.4** `TwoFactorSection`: máquina de estados `idle | verifying | disabling`. Activación `beginTwoFactorSetup → verifyTwoFactorSetup(code)`; desactivación `disableTwoFactor(code)`. `secret`/`qrCode` se descartan (no se renderizan). Botón "Desactivar" oculto cuando `twoFactorRequired === true` con badge "Obligatorio para tu rol".
- [x] **4.5** `SessionsSection`: listar sesiones + `revokeSession` + `revokeOtherSessions` con `<ConfirmDialog>`. La sesión actual no muestra botón de revocar.
- [ ] **4.6** Validar accesibilidad y focus management en modales. **(pendiente: se cubre en Fase 6 — hardening)**

**Commits aplicados (2026-10-28):**

- `5afe564 feat(user-settings): agregar esqueleto de la sección de seguridad`
- `8756368 feat(user-settings): agregar cambio de contraseña en Security`
- `40c82a0 feat(user-settings): agregar cambio de correo en Security`
- `c6ef2cc feat(user-settings): agregar gestión de 2FA en Security`
- `b0fc86b feat(user-settings): agregar gestión de sesiones en Security`

**Estado (2026-10-28):** Fase 4 **completa** salvo el punto 4.6 (accesibilidad), diferido a Fase 6 (hardening). Patrón `refetch` `network-only` centralizado aplicado y verificado. Siguiente: Fase 5 (secciones exclusivas de student).

---

### Fase 5 — Secciones exclusivas de student ✅ CERRADA

> **Estado 2026-10-28:** Fase 5 **completa**. Los 4 sub-pasos y el prerrequisito de infraestructura están commiteados. Con esta fase se cierra la implementación de las 9 secciones del plan. Siguiente: Fase 6 (endurecimiento).

**Prerrequisito de Fase 5 (cerrado el 2026-10-28):**

- [x] **5.0** `refactor(urql): activar keys de Fase 5 y updates de removePaymentMethod`
      (`7781616`). Añade a `UrqlProvider`:
  - `Certificate`, `PaymentMethod`, `Invoice` en `keys` por `id`.
  - `CourseEnrollment` en `keys` por `courseId`.
  - `updates.Mutation.removePaymentMethod` para quitar el `PaymentMethod`
    de `myPaymentMethods` al éxito (contrato §7 y plan §8.2.23).

**Sub-pasos:**

- [x] **5.1** `AccountSection`: `myAccount` + deactivation/cancelación con
      confirmación fuerte. (`43ea6d2`)
  - `AccountSection` (Server) + `AccountClient` (Client).
  - Cuatro estados renderizados: `active`, `pending_deactivation`,
    `suspended`, `inactive`. Los dos últimos son informativos.
  - `deactivationScheduledAt` formateado con `Intl.DateTimeFormat`
    (`dateStyle: 'long'` + `timeStyle: 'short'`), coherente con
    `SessionsSection`.
  - Dos `<ConfirmDialog>` independientes (solicitar / cancelar), D8 y D-AC.
  - `useSectionMutation` con `parseVariables: () => ({})` (mutaciones sin
    input). Ambas devuelven `Account` completo (D7) → normalización, sin
    refetch explícito (D-AD).
  - `403` para teacher/admin: no se renderiza la sección (`getVisibleSections`
    ya la excluye).

- [x] **5.2** `CoursesSection`: `myCourses` (lectura). (`5b6ca39`)
  - `CoursesSection` (Server) + `CoursesClient` (Client).
  - Cada curso enlaza a `/courses/{courseId}` con `Link` de
    `@/i18n/navigation` (locale preservado).
  - `<progress>` nativo + estilos Tailwind cruzados (webkit + moz) contra
    las variables del tema. Semántica accesible gratis.
  - `completedAt` llega como `unknown` (DateTime); se estrecha a
    `string | null` antes de usarlo en JSX.
  - `403` para teacher/admin: no se renderiza.

- [x] **5.3** `CertificatesSection`: `myCertificates` (lectura + descarga),
  - refactor `CertificateEligibility`. (`58a0862`)
  - `CertificatesSection` (Server) + `CertificatesClient` (Client).
  - `CertificateEligibility` se **mueve** de `ProfileSection` a
    `CertificatesSection`: en Fase 3 vivía en Profile por pragmatismo (no
    existía sección de certificados); ahora es su lugar natural.
  - `ProfileSection` queda con dos bloques (avatar + form). Se elimina la
    prop `showCertificates` y el cálculo en `page.tsx`.
  - `downloadUrl` con `<a target="_blank" rel="noopener noreferrer">`
    (URL absoluta firmada, contrato §5.8).
  - `issuedAt` se estrecha de `unknown` a `string | null` (DateTime).

- [x] **5.4** `BillingSection`: `mySubscription`, `myPaymentMethods`,
      `myInvoices`, `changeSubscriptionPlan`, `cancelSubscription`,
      `removePaymentMethod`. Dividida en dos commits.
  - [x] **5.4.a** Lectura (`d437fcd`). `BillingSection` (Server) +
        `BillingOverviewClient` (Client) + `SubscriptionClient`,
        `PaymentMethodsClient`, `InvoicesClient`. Patrón
        `SecurityOverviewClient`: un contenedor centraliza las tres queries,
        sin refetch explícito.
  - [x] **5.4.b** Mutaciones (`0f25c40`). `<select>` de plan (excluye
        `enterprise` y el plan actual), `<ConfirmDialog>` para
        `changeSubscriptionPlan` (incluso `free → premium` porque implica
        cobro prorrateado). `<ConfirmDialog>` para `cancelSubscription`
        (oculto si ya cancelada). `<ConfirmDialog>` por fila para
        `removePaymentMethod`.
  - **Primera activación real del `updates.Mutation.removePaymentMethod`**
    (preparado en `7781616`): la eliminación se refleja en
    `myPaymentMethods` sin refetch. Verificado manualmente.
  - `403` para teacher/admin: no se renderiza.

**Deudas diferidas:** ver §10.8.

---

### Fase 6 — Endurecimiento

- **6.1** Estados vacíos, errores de red, loading consistentes.
- **6.2** Accesibilidad: `aria-busy`, `role="alert"`, focus en modales.
- **6.3** Revisión de `graphcache`: cada mutación actualiza correctamente las
  queries relacionadas.
- **6.4** Ejecutar y pasar: `pnpm type-check`, `pnpm lint`,
  `pnpm graphql:validate`, `pnpm mock:test`.
- **6.5** Revisión final del contrato con el backend.

**Commit sugerido:** `chore(user-settings): hardening and QA pass`

---

## 7. Convenciones

### 7.1 Código

- **Server Components** para orquestación y fetching de sesión/traducciones.
- **Client Components** para formularios, mutaciones e interactividad.
- Los datos de presentación (nombre, email, imagen) **siempre** vienen del BFF
  vía GraphQL, nunca de la sesión.
- Manejo de errores por **código** (`error.code`), nunca por texto.
- Traducciones vía message bags explícitos desde el servidor hacia el cliente.
- Sin `any`. Tipar todo (contrato, resolvers, componentes).

### 7.2 Commits

- Un commit por hito significativo (fin de fase o sub-fase grande).
- Mensajes en formato convencional:
  - `feat(scope): descripción`
  - `fix(scope): descripción`
  - `docs(scope): descripción`
  - `test(scope): descripción`
  - `chore(scope): descripción`
- `scope` típico: `user-settings`, `bff`, `backend`, `contract`.

### 7.3 Archivos y naming

- Componentes: PascalCase (`ProfileSection.tsx`).
- Hooks: camelCase con prefijo `use` (`useSectionMutation.ts`).
- Config: kebab-case (`user-settings-sections.ts`).

---

## 8. Validación y ajustes del contrato de la API

> A medida que avancemos, iremos detectando necesidades de cambio en
> `docs/BACKEND_API.md`. Esta sección centraliza los ajustes acordados.

### 8.1 Puntos a revisar

> **Nota de navegación (post Fase 1.6).** Los ajustes §8.2.x describen
> cambios acordados al contrato. Con la modularización del contrato
> (Fase 1.6), su hogar físico pasa a ser `docs/backend-api/`. La
> numeración §8.2.N se mantiene aquí como referencia estable para este
> plan; los contratos modularizados reflejan el contenido final en las
> secciones §3.4, §3.6, §3.7, §3.8, §8 y §11.

- [ ] ¿El contrato distingue en algún punto por rol? (Hoy no lo hace
      explícitamente; la autorización por rol se delega al BFF.)
- [x] `POST /users/me/account/deactivation` para `teacher`/`admin` — `403` documentado. Ver 8.2.19.
- [x] Errores por endpoint de las secciones nuevas en Billing. Ver 8.2.22.
- [x] Revisar si hace falta exponer algún campo adicional en el contrato
      para soportar la lógica de rol. Revisado: `twoFactorRequired` ya existe
      en `SecuritySettings`. Sin cambios.
- [ ] `pendingEmail` en `SecuritySettings` para exponer correo en verificación.
      Fuera del alcance inicial; evaluar como `8.2.8`. Ver TODO(email-change).
- [ ] Múltiples medios de 2FA (SMS, TOTP, códigos de respaldo) y preferencia
      de medio. Fuera del alcance; ver TODO(seguridad-2fa).
- [ ] Flujo de login con 2FA: cómo bifurcar `authorize` en Auth.js y cómo
      resolver el segundo factor en el cliente. Ver TODO(auth-2fa).
- [ ] **TODO temporal** (se borra al cerrar el plan completo): flujo completo
      de 2FA en login. Ver 8.2.15.
- [ ] TODO(theme-no-flash): estrategia de hidratación del `ThemeProvider` del
      dashboard para eliminar el parpadeo entre `localStorage` y
      `myPreferences`. Fuera de alcance del Bloque 1.
- [ ] TODO(i18n-sync): sincronización de `myPreferences.language` con el locale
      de la URL al montar el dashboard. Fuera de alcance del Bloque 1.
- [ ] TODO(tz-global): aplicar `timezone` en el resto de la app (formateo de
      fechas, calendario). Fase 6+.

Resueltos:

**Profile**

- [x] Validaciones de longitud para `bio.title`, `bio.description` e
      `interests` en `PATCH /users/me/profile`. Ver 8.2.1.
- [x] `UpdateBioInput` con campos opcionales para permitir PATCH parcial dentro
      del bio. Ver 8.2.2.
- [x] `Bio.title` y `Bio.description` nullable. Ver 8.2.3.

**Personal Data**

- [x] `PATCH /users/me/personal-data` con `identityLocked: true` — semántica
      definida (rechazo atómico con `403 FORBIDDEN` solo si el payload incluye
      campos de identidad). Ver 8.2.7.
- [x] Validaciones de longitud y formato para todos los campos de
      `PATCH /users/me/personal-data`. Ver 8.2.5.
- [x] Añadido `documentType` (`passport` | `dni`) a `PersonalData` y a
      `UpdatePersonalDataInput`. Ver 8.2.6.

**Security**

- [x] `POST /users/me/security/two-factor/disable` con
      `twoFactorRequired: true` — documentado. Bloqueo en BFF con `403`.
      Ver 8.2.14.
- [x] Códigos de error diferenciados para email-change. Ver 8.2.11.
- [x] Reglas explícitas de `newPassword` en el contrato. Ver 8.2.13.
- [x] Efecto secundario de `changePassword` (cierra otras sesiones). Ver 8.2.12.
- [x] Formato del código 2FA (`/^\d{6}$/`). Ver 8.2.14.
- [x] `revokeSession` con `sessionId === actual` → `409`. Ver 8.2.11.

**Preferences**

- [x] Regla general PATCH formalizada en §9 del contrato. Ver 8.2.17.
- [x] `null` en `PATCH /users/me/preferences` → `422 VALIDATION_ERROR`. Ver 8.2.16.
- [x] `notifications: {}` no modifica; `notifications: null` → `422`. Ver 8.2.16.
- [x] `language` restringido a `es | en`. Ver 8.2.16.

**Privacy**

- [x] `null` en `PATCH /users/me/privacy` → `422 VALIDATION_ERROR`. Ver 8.2.18.
- [x] `PublicProfile` expone `allowDirectMessages: Boolean!`. Ver 8.2.18.
- [x] Matriz de visibilidad de `publicProfile` documentada. Ver 8.2.18.

**Account**

- [x] `403 FORBIDDEN` para teacher/admin en ambas mutations. Ver 8.2.19.
- [x] `deactivationScheduledAt` con fecha exacta localizada. Ver 5.6.8.
- [x] `suspended` / `inactive` no asignables desde User Settings. Ver 5.6.1.

**Courses**

- [x] `progress` en rango `[0.0, 1.0]`. Ver 8.2.20.
- [x] `403 FORBIDDEN` para teacher/admin. Ver 8.2.20.
- [x] `CourseEnrollment: (data) => data.courseId` en `UrqlProvider`. Ver 8.2.20.

**Certificates**

- [x] `downloadUrl` firmada con expiración. Ver 8.2.21.
- [x] `403 FORBIDDEN` para teacher/admin. Ver 8.2.21.
- [x] `CertificateEligibility` es informativo (bloquea generación, no visualización). Ver 5.8.8.

**Billing**

- [x] `changeSubscriptionPlan`: upgrade inmediato, downgrade a fin de período. Ver 8.2.22.
- [x] `cancelSubscription`: detiene cobros, mantiene acceso hasta `currentPeriodEnd`. Ver 8.2.22.
- [x] `403 FORBIDDEN` para teacher/admin en todas las operaciones. Ver 8.2.22.
- [x] `removePaymentMethod` con `updates` explícito en `UrqlProvider`. Ver 8.2.23.

### 8.2 Ajustes acordados

#### 8.2.1 `PATCH /users/me/profile` — validaciones nuevas

Añadidas al contrato las siguientes reglas de validación para `BackendUpdateProfileInput`:

| Campo             | Regla                                               |
| ----------------- | --------------------------------------------------- |
| `bio.title`       | 1 a 100 caracteres.                                 |
| `bio.description` | 1 a 500 caracteres.                                 |
| `interests`       | Máximo 20 items. Cada item entre 1 y 40 caracteres. |
| `image`           | URL absoluta, data URI o `null`. Sin cambio.        |

Estas reglas se aplican solo si el campo se envía (semántica PATCH). Si el campo
se omite, no se modifica. Si se envía `null` en `bio` o `interests`, se borra el
valor completo.

#### 8.2.2 `UpdateBioInput` con campos opcionales

Cambiado el schema GraphQL y el contrato REST para permitir `title` y
`description` opcionales dentro de `UpdateBioInput`.

````md
- **Antes**:

  ```graphql
  input UpdateBioInput {
    title: String!
    description: String!
  }
  ```

- **Después**:

  ```graphql
  input UpdateBioInput {
    title: String
    description: String
  }
  ```

Semántica:

- `title` omitido → no se modifica.
- `title: null` → se borra el título.
- `title: "..."` → se asigna.
- Mismo comportamiento para `description`. Para borrar la bio completa, el
  cliente envía `bio: null` (nivel superior).

#### 8.2.3 Bio.title y Bio.description nullable

Cambiado el tipo `Bio` en el schema GraphQL para que `title` y `description`
admitan `null`.

Antes:

```graphql
type Bio {
  title: String!
  description: String!
}
```

Después:

```graphql
type Bio {
  title: String
  description: String
}
```

`null` indica que el campo no tiene valor. El objeto `bio` completo puede ser
`null` si el usuario no tiene bio.

#### 8.2.4 `image` como data URI — mejora futura

Mantener el flujo actual (data URI) por ahora. Dejar constancia en el contrato
de que a futuro conviene un endpoint de subida dedicado
(`POST /users/me/avatar` o similar), para evitar payloads grandes en el body de
`PATCH /users/me/profile`. No bloquea la implementación actual.

#### 8.2.5 `PATCH /users/me/personal-data` — validaciones y semántica PATCH

Añadidas al contrato las siguientes reglas de validación para
`BackendUpdatePersonalDataInput`:

| Campo          | Regla                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `firstName`    | 2-100 caracteres. Solo letras, espacios, apóstrofes, guiones y puntos. **No acepta `null`** → `422 VALIDATION_ERROR`. |
| `lastName`     | Idem `firstName`. **No acepta `null`** → `422 VALIDATION_ERROR`.                                                      |
| `documentType` | Enum cerrado: `passport` \| `dni`.                                                                                    |
| `documentId`   | 1-30 caracteres alfanuméricos (`A-Z`, `a-z`, `0-9`, `-`).                                                             |
| `phone`        | Formato E.164 (`+573001234567`).                                                                                      |
| `country`      | ISO 3166-1 alpha-2 en mayúsculas. Longitud exacta 2.                                                                  |
| `address`      | 1-200 caracteres. Letras, dígitos, espacios y `.,-#/°`.                                                               |

Semántica PATCH parcial (aplicable a todos los campos):

- Omitir el campo (`undefined`) → no se modifica.
- Enviar `null` → borra el valor. **Excepción:** `firstName` y `lastName` no
  aceptan `null`.
- Enviar un valor → se asigna el nuevo valor.

El contrato `BACKEND_API.md` debe documentar esta semántica explícitamente en la
sección de `PATCH /users/me/personal-data`, así como la excepción de
`firstName` y `lastName`.

#### 8.2.6 Nuevo campo `documentType`

Se añade el campo `documentType` a `BackendPersonalData` y
`BackendUpdatePersonalDataInput`. Requiere:

- Nuevo enum GraphQL `DocumentType { passport, dni }`.
- Actualizar `src/graphql/schema/settings/personal-data.graphql`.
- Actualizar `src/lib/backend/types.ts` con
  `BackendDocumentType = 'passport' | 'dni'`.
- Actualizar `MockBackendClient.personalData.getMe` / `.update`.
- Actualizar `src/graphql/operations/settings/my-personal-data.graphql` y
  `update-personal-data.graphql`.
- Regenerar `src/graphql/generated/graphql.ts` con `pnpm graphql:codegen`.
- Añadir etiquetas i18n `documentType.passport` / `documentType.dni` en
  `es.json` y `en.json`.
- El catálogo de países (`country`) se hardcodea en frontend en
  `src/config/countries.ts`. El catálogo de tipos de documento se hardcodea
  junto a los schemas en Fase 3.

**Estado (2026-10-18):** `documentType` implementado de punta a punta en
types, schema, operations, generated, resolver y mock. Las etiquetas i18n
`documentType.passport` / `documentType.dni` **quedan diferidas a Fase 3**,
cuando se construya la UI de `PersonalDataSection`.

Motivo: algunos países usan pasaporte como identificación principal; otros,
documento nacional. Ambos casos se soportan desde el inicio. La validación de
identidad real (verificación contra el documento) se deja como TODO detallado
en el código para versiones posteriores.

#### 8.2.7 `identityLocked` como bloqueo granular

Se redefine `identityLocked` como un bloqueo **parcial**:

- Bloquea los campos de identidad: `firstName`, `lastName`, `documentType`,
  `documentId`.
- **No** bloquea los campos de contacto: `phone`, `country`, `address`.

Comportamiento en PATCH mixto (`identityLocked === true`):

- Si el payload incluye al menos un campo de identidad → **rechazo atómico** con
  `403 FORBIDDEN`. Ningún campo se actualiza, ni siquiera los de contacto que
  vinieran en el mismo payload.
- Si el payload solo incluye campos de contacto → se aplica normalmente.

El contrato `BACKEND_API.md` debe documentar:

- Qué campos bloquea `identityLocked`.
- La semántica de rechazo atómico.
- El código exacto de error: `403 FORBIDDEN`.

La UI debe deshabilitar los campos de identidad cuando `identityLocked === true`
y mostrar el motivo.

#### 8.2.8 `PUT /users/me/security/password` — reglas explícitas

Se documentan en el contrato las reglas de `newPassword`:

- 6 a 15 caracteres.
- Al menos 1 letra minúscula, 1 letra mayúscula y 1 carácter especial
  (por ejemplo `!`).
- No puede ser igual a `currentPassword` → `409 CONFLICT`.
- `currentPassword` incorrecta → `422 INVALID_CURRENT_PASSWORD`.

Son las mismas reglas que registro/reset. Se documentan explícitamente en §11
porque `changePassword` es el flujo donde más se atacan las cuentas.

#### 8.2.9 Código 2FA — formato

`code` (en `verifyTwoFactorSetup` y `disableTwoFactor`) es un string de
exactamente **6 dígitos numéricos**. Regex: `/^\d{6}$/`. Fuera de alcance:
códigos de respaldo, TOTP con ventana extendida, múltiples medios.

El único medio soportado actualmente es el correo electrónico del usuario.

#### 8.2.10 `DELETE /users/me/security/sessions/:sessionId` — sesión actual

Revocar la sesión actual (`sessionId === sesión actual`) responde
`409 CONFLICT`. La UI oculta la acción para la sesión actual
(`Session.current === true`). Motivo: revocar la sesión actual cerraría la
sesión activa del usuario y lo dejaría sin acceso; el flujo correcto es "cerrar
sesión", no "revocar sesión".

#### 8.2.11 Nuevos códigos de error para Security

Añadir a §4.2 del contrato:

| HTTP  | Código               | Endpoint                                        |
| ----- | -------------------- | ----------------------------------------------- |
| `409` | `EMAIL_TAKEN`        | `POST /users/me/security/email-change`          |
| `409` | `EMAIL_UNCHANGED`    | `POST /users/me/security/email-change`          |
| `409` | `SESSION_IS_CURRENT` | `DELETE /users/me/security/sessions/:sessionId` |

Motivo: `EMAIL_TAKEN` y `EMAIL_UNCHANGED` permiten traducir mensajes distintos
en la UI. `SESSION_IS_CURRENT` permite mensaje específico "no puedes cerrar tu
propia sesión desde aquí".

#### 8.2.12 `changePassword` cierra otras sesiones automáticamente

Documentar en el contrato que `PUT /users/me/security/password` revoca todas
las sesiones del usuario excepto la actual. La UI refresca `mySecuritySettings`
con `network-only` tras el éxito.

#### 8.2.13 Reglas explícitas de `newPassword`

Documentar en el contrato §3.5.X las reglas de `newPassword`:

- 6 a 15 caracteres.
- Al menos 1 minúscula, 1 mayúscula, 1 carácter especial.
- No puede ser igual a `currentPassword` → `409 CONFLICT`.

Mismas reglas que registro/reset. Se documentan explícitamente porque
`changePassword` es el flujo más atacado.

#### 8.2.14 Flujo de 2FA — documentación en contrato

Documentar en el contrato §3.5.X:

- Medio actual: correo electrónico.
- Código: 6 dígitos numéricos (`/^\d{6}$/`).
- Roles: student opcional; teacher/admin obligatorio.
- Activación/desactivación en dashboard vía BFF.
- Fuera de alcance: múltiples medios, 2FA en login.

#### 8.2.15 TODO: 2FA en login (fuera de alcance)

Documentar en §8.1 con detalle:

- Nuevos endpoints REST: `POST /auth/login/two-factor/verify` y
  `POST /auth/login/two-factor/resend`.
- Cambio en `POST /auth/login` para devolver `twoFactorRequired: true` +
  `challengeId` cuando 2FA esté activo.
- Refactor de `authorize` en `src/auth.ts`.
- Refactor de `LoginForm.tsx` con modal.
- Nota: el 2FA en login usa REST directo, no GraphQL.

**Este TODO es temporal. Al finalizar el plan completo, este bloque se elimina
del documento.**

#### 8.2.16 `PATCH /users/me/preferences` — excepción a la regla general PATCH

Se aplica la regla general formalizada en §9 del contrato:

| Valor enviado               | Efecto                                                                  |
| :-------------------------- | :---------------------------------------------------------------------- |
| Campo omitido (`undefined`) | No se modifica.                                                         |
| `null`                      | **Rechazado con `422 VALIDATION_ERROR`**. Excepción a la regla general. |
| Valor concreto              | Se asigna.                                                              |

Motivo de la excepción: todos los campos de `Preferences` son obligatorios en la respuesta (`String!`, `Theme!`, etc.) y no tienen un estado vacío válido.

Reglas adicionales:

- `language` debe ser `es` o `en`. Otro valor → `422`.
- `notifications: {}` equivale a omitir el campo; `notifications: null` → `422`.
- `accessibility` sigue las mismas reglas que `notifications`.
- `timezone` debe ser una zona horaria IANA válida.

El BFF (`src/graphql/resolvers/preferences.ts`) valida `null`, `language` y normaliza antes de llamar al backend. El backend vuelve a validar como defensa en profundidad.

#### 8.2.17 Regla general PATCH formalizada en §9 del contrato

Se formaliza en `BACKEND_API.md` §9 la semántica transversal de `PATCH`:

| Valor enviado               | Efecto                                       |
| :-------------------------- | :------------------------------------------- |
| Campo omitido (`undefined`) | No se modifica.                              |
| `null`                      | Se borra el valor (queda vacío / sin valor). |
| Valor concreto              | Se asigna.                                   |

Esta regla aplica a todos los endpoints `PATCH` del contrato. Las excepciones se documentan en la sección del endpoint correspondiente; por ejemplo, `PATCH /users/me/preferences` no admite `null`.

#### 8.2.18 `PATCH /users/me/privacy` — excepción a la regla general PATCH

Se aplica la regla general formalizada en §9 del contrato:

| Valor enviado               | Efecto                                                                  |
| :-------------------------- | :---------------------------------------------------------------------- |
| Campo omitido (`undefined`) | No se modifica.                                                         |
| `null`                      | **Rechazado con `422 VALIDATION_ERROR`**. Excepción a la regla general. |
| Valor concreto              | Se asigna.                                                              |

Motivo: todos los campos de `PrivacySettings` son obligatorios en la respuesta (`ProfileVisibility!`, `Boolean!`) y no tienen estado vacío válido.

Cambio de schema: `PublicProfile` expone `allowDirectMessages: Boolean!` para que otros usuarios sepan si pueden escribir. Requiere actualizar:

- `src/graphql/schema/user.graphql`.
- `src/graphql/operations/profile/public-profile.graphql`.
- `src/lib/backend/types.ts` (`BackendPublicProfile.allowDirectMessages: boolean`).
- `src/lib/mock/client.ts` (`getPublicProfile`).
- Regenerar `src/graphql/generated/graphql.ts`.

Matriz de visibilidad de `publicProfile` (documentar en §3.5 del contrato):

| Campo de `PublicProfile` | Control             | Comportamiento                                                                        |
| :----------------------- | :------------------ | :------------------------------------------------------------------------------------ |
| `id`, `name`, `image`    | `profileVisibility` | Si no cumple → `404` (perfil no visible).                                             |
| `bio`, `interests`       | `profileVisibility` | Ídem.                                                                                 |
| `email`                  | `emailVisibility`   | `everyone` → visible. `authenticated` → visible con Bearer válido. `nobody` → `null`. |
| `phone`                  | `phoneVisibility`   | Ídem `email`.                                                                         |
| `allowDirectMessages`    | —                   | Siempre visible si el perfil es visible.                                              |

#### 8.2.19 `POST/DELETE /users/me/account/deactivation` — autorización por rol

Documentar en §11 del contrato:

- `POST /users/me/account/deactivation` → `403 FORBIDDEN` para teacher/admin.
- `DELETE /users/me/account/deactivation` → `403 FORBIDDEN` para teacher/admin.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

#### 8.2.20 Courses — validaciones y autorización

Documentar en §5 y §11 del contrato:

- `progress`: `Float` en rango `[0.0, 1.0]`. Fuera de rango → el backend debe normalizar o rechazar con `500` (error de datos, no de usuario).
- `GET /users/me/courses` → `403 FORBIDDEN` para teacher/admin.
- `paused` no es asignable desde User Settings. Lo asigna otro módulo.

#### 8.2.21 Certificates — validaciones y autorización

Documentar en §5 y §11 del contrato:

- `downloadUrl`: URL absoluta firmada con expiración. El backend decide el TTL. La UI debe tratarla como de un solo uso.
- `GET /users/me/certificates` → `403 FORBIDDEN` para teacher/admin.

#### 8.2.22 Billing — semántica de cancelación y autorización

Documentar en §6 y §11 del contrato:

- `changeSubscriptionPlan`:
  - Upgrade (`free → premium`): inmediato, con cobro prorrateado.
  - Downgrade (`premium → free`): a fin de período (`currentPeriodEnd`).
- `cancelSubscription`:
  - Detiene cobros futuros. Setea `cancelAtPeriodEnd: true`.
  - Mantiene `status: 'active'` hasta `currentPeriodEnd`.
  - Después pasa a `canceled` y `expired`.
  - El usuario conserva acceso hasta el fin del período pagado.
- `403 FORBIDDEN` para teacher/admin en todas las queries y mutations de Billing.

#### 8.2.23 `removePaymentMethod` — `updates` explícito en `UrqlProvider`

`removePaymentMethod` devuelve `Boolean!`, no una entidad. Para que graphcache actualice `myPaymentMethods` sin refetch, se incluye `updates` explícito en `UrqlProvider`:

- Al éxito, remover el `PaymentMethod` con `paymentMethodId` de la lista.

Ver `src/components/providers/UrqlProvider.tsx`. Implementación en Fase 5.

**Estado (2026-10-18):** el `updates` explícito **queda diferido a Fase 5.4**,
junto con la construcción de `BillingSection`. El contrato v1.3 ya documenta
el comportamiento esperado.

---

## 9. Bitácora

| Fecha      | Fase                                            | Estado    | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —          | Fase 0.1                                        | Cerrado   | Patrón de mutaciones: URQL + graphcache puro. `router.refresh()` en `ProfileAvatarSettings` se elimina en Fase 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| —          | Fase 0.2                                        | Cerrado   | Patrón de modales: `<ConfirmDialog>` para confirmaciones destructivas; formularios inline en `<SectionCard>` para el resto.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| —          | Fase 0.3                                        | En curso  | Análisis de schema sección por sección.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| —          | Fase 0.3 / Profile                              | Cerrado   | Análisis completo en 5.1. Contrato actualizado: ver 8.2.1, 8.2.2, 8.2.3, 8.2.4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| —          | Fase 0.3 / Personal Data                        | Cerrado   | Análisis completo en 5.2. Contrato actualizado: ver 8.2.5, 8.2.6, 8.2.7. Nueva sub-fase 0.6 (reorganización Zod) definida.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| —          | Fase 0.3 / Security                             | Cerrado   | Análisis completo en 5.3. Contrato actualizado: ver 8.2.11 a 8.2.15. TODO temporal de 2FA en login documentado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| —          | Fase 0.3 / Preferences                          | Cerrado   | Análisis completo en 5.4. Contrato actualizado: ver 8.2.16 y 8.2.17. Regla general PATCH formalizada en §9 del contrato.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| —          | Fase 0.3 / Privacy                              | Cerrado   | Análisis completo en 5.5. Contrato actualizado: ver 8.2.18. `PublicProfile` expone `allowDirectMessages`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| —          | Fase 0.3 / Account                              | Cerrado   | Análisis completo en 5.6. Contrato actualizado: ver 8.2.19. `403` para teacher/admin. Fecha exacta localizada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| —          | Fase 0.3 / Courses                              | Cerrado   | Análisis completo en 5.7. Contrato actualizado: ver 8.2.20. `progress` en `[0,1]`. `403` para teacher/admin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| —          | Fase 0.3 / Certificates                         | Cerrado   | Análisis completo en 5.8. Contrato actualizado: ver 8.2.21. `downloadUrl` firmada. `403` para teacher/admin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| —          | Fase 0.3 / Billing                              | Cerrado   | Análisis completo en 5.9. Contrato actualizado: ver 8.2.22 y 8.2.23. Upgrade inmediato, downgrade a fin de período.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| —          | Fase 0.3                                        | Cerrado   | 9/9 secciones cerradas. Fase 0 completa (0.1, 0.2, 0.3, 0.4, 0.5). Sub-fase 0.6 diferida a Fase 3 por diseño.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-18 | Contrato v1.3                                   | Cerrado   | Sincronización de `BACKEND_API.md` con los ajustes de Personal Data y Security (§3.7, §3.8, §4.2, §11). Commit `docs(contract): sync v1.3 with Personal Data and Security adjustments`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-18 | Fase 0.3 implementación en código               | Cerrado   | Personal Data (`documentType`, validaciones, `identityLocked` atómico) y Security (`EMAIL_TAKEN`/`EMAIL_UNCHANGED`/`SESSION_IS_CURRENT`, `changePassword` cierra sesiones) implementados en types, schema, operations, generated, resolver y mock. `pnpm mock:test` 59/59. Commits `feat(personal-data)`, `fix(bff)`, `test(bff)`.                                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-19 | Fase 0.6 (reorganización Zod)                   | Cerrado   | `src/lib/schemas/**` (primitives, fields, auth, contact) y `src/lib/errors/**` (api, auth, contact). 5 archivos viejos eliminados, 13 consumidores migrados. `pnpm type-check`, `pnpm lint`, `pnpm mock:test` 59/59 en verde. Commit `refactor(schemas): reorganizar schemas Zod y códigos de error por dominio`.                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-10-19 | Fase 1 (auth por rol en BFF)                    | Cerrado   | `requireRole` en `auth.ts` aplicado en `account`, `courses`, `certificates`, `billing`, `security.disableTwoFactor`. `context.ts` sin TODO. 11 `authTests` pasan. Commit `3d03535 feat(bff): aplicar autorización por rol en queries y mutations de settings`.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-19 | Fase 1.5 (lint preexistente)                    | Pendiente | 34 problemas (4 errors, 30 warnings) heredados de la época en que ESLint estaba crasheado por la instalación de TS 6/7. Se resuelven antes de Fase 2. Estado al iniciar: pendiente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-19 | Fase 1.6 (modular contrato)                     | Pendiente | `docs/BACKEND_API.md` tiene 1.471 líneas. Se divide en `docs/backend-api/` por dominio (13 archivos), con README índice y sin stub (`docs/BACKEND_API.md` se elimina). Sin cambios de contenido. Estado al iniciar: pendiente.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-19 | Fase 2 (infra UI compartida)                    | En espera | Bloqueada por 1.5 y 1.6. Orden aprobado: `user-settings-sections.ts` → `SectionCard` → `SettingsSkeleton` → `ConfirmDialog` → `useSectionMutation`. Decisiones D-A (A1), D-B (B1), D-C (C2) fijadas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-10-24 | Fase 2 (infra UI compartida)                    | Cerrado   | 5 archivos creados: `src/config/user-settings-sections.ts`, `src/components/ui/{SectionCard,SettingsSkeleton,ConfirmDialog}.tsx`, `src/hooks/useSectionMutation.ts`. D-A (SectionCard Server), D-B (useSectionMutation wrapper de URQL, `errorCode: string                                                                                                                                                                                                                                                                                                                                                                                                                              | null`, sin `graphql-errors.ts`en Fase 2), D-C (ConfirmDialog`<dialog>`nativo, sin animación de salida) cerradas.`pnpm type-check`, `pnpm lint`, `pnpm mock:test`59/59,`pnpm graphql:validate`en verde. Commit`feat(user-settings): add shared UI primitives`. |
| 2026-10-24 | Fase 3 / i18n `personalData`                    | Cerrado   | Commit `feat(i18n): agregar claves de datos personales y limpiar claves muertas`. Añade `dashboard.userSettings.personalData` + `Validation.{documentType,documentId,phone,country,address}` en es/en. Limpia código muerto: `home.HomeFeatures` (es, duplicado de `home.hero.dashboardPreview`) y `Validation.error` (en, sin consumidores). Deuda detectada: `pages.subscription.{title,monthly,yearly}` existe en `es.json` y no en `en.json`, sin consumidores. Anotada en §10.6. `pnpm type-check` + `pnpm lint` verde.                                                                                                                                                            |
| 2026-10-24 | Fase 3 / i18n `preferences`+`privacy`+`profile` | Cerrado   | Commit `feat(i18n): agregar claves de preferencias, privacidad y perfil`. Añade `dashboard.userSettings.{preferences,privacy,profile}` + `Validation.{preferences,privacy,bio,interests,image}.*` en es/en. Incluye `notes.theme` para reforzar D-G (PreferencesSection es la fuente persistida; ThemeToggle solo toca localStorage). Validado con `jq` (JSON válido), `diff` de claves aplanadas (solo diferencias preexistentes `pages.subscription.*`), no-colisión con `footer.legal.privacy` y `home.benefits.platform.privacy`. `pnpm type-check` + `pnpm lint` verde.                                                                                                            |
| 2026-10-24 | Fase 3 / i18n (sub-fase 3)                      | Cerrada   | Cierre completo de la sub-fase 3. Los 4 namespaces `dashboard.userSettings.{personalData,preferences,privacy,profile}` y sus `Validation.*` correspondientes están implementados y commiteados. Fase 3 lista para arrancar la construcción de componentes (paso 4 del orden aprobado: `PersonalDataSection.tsx`).                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-10-25 | Fase 3 / `PersonalDataSection`                  | Cerrado   | `PersonalDataSection.tsx` (Server) + `PersonalDataFormClient.tsx` (Client). D-E: Plan B (leer `me.id` de caché de `SidebarData`; `PersonalData` no tiene `id` en el contrato REST). `superRefine` de pareja `documentType`/`documentId` en `personalDataSchema`. `updates.Mutation.updatePersonalData` en `UrqlProvider`. Commits `2d3e79b` y `4e94f4a`. `pnpm type-check` + `pnpm lint` + `pnpm mock:test` (59/59) en verde.                                                                                                                                                                                                                                                           |
| 2026-10-25 | Fase 3 / `PreferencesSection`                   | Cerrado   | `PreferencesSection.tsx` (Server) + `PreferencesFormClient.tsx` (Client). D-J/D-K: `reset` → `setTheme` → `router.replace` en `onSuccess`. D-L: `timezone` input de texto con `TODO(timezone-select)`. D-M: toggles nativos. D-N: 3 `<fieldset>`. `mapError` sin `FORBIDDEN`/`CONFLICT`. Integrado en `page.tsx`. Commits `feat(i18n): ...` + `feat(user-settings): agregar sección de preferencias` + `feat(user-settings): integrar secciones de datos personales y preferencias`. `pnpm type-check` + `pnpm lint` + `pnpm mock:test` (59/59) + test manual 6/7 OK.                                                                                                                   |
| 2026-10-25 | Fase 3 / Deudas documentadas                    | Cerrado   | Dos `TODO` añadidos al código (`TODO(timezone-select)` en `PreferencesFormClient.tsx`, `TODO(dashboard-layout)` en `layout.tsx`) y anotados en §10.6. Commit `docs(user-settings): documentar deudas de timezone, sidebar y actualizar plan`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-26 | Fase 3 / `PrivacySection`                       | Cerrado   | `PrivacySection.tsx` (Server) + `PrivacyFormClient.tsx` (Client). `mapError` limitado a `VALIDATION_ERROR`/`INTERNAL_ERROR`. `defaultValues` vacío hasta que la query resuelve (evita flash de `'everyone'`). `autoComplete="off"` en 3 selects + checkbox. `aria-describedby` condicional en `allowDirectMessages`. Commits `774efab feat(user-settings): agregar sección de privacidad` (el hash cambió por `git restore`/amend implícito; el contenido es el mismo que `01513f3`). `pnpm type-check` + `pnpm lint` + `pnpm mock:test` (59/59) en verde.                                                                                                                              |
| 2026-10-26 | Fase 3 / `ProfileSection` refactor              | Cerrado   | `ProfileSection.tsx` reescrito como Server Component. `ProfileFormClient.tsx` nuevo (bio + `interests`, `InterestsField` inline, PATCH diferencial anidado). `ProfileAvatarSettings.tsx` refactorizado (sin `set-state-in-effect`, sin `router.refresh()`, migrado a `useSectionMutation`, `fallbackName`/`fallbackEmail` en `avatarMessages`). `CertificateEligibility.tsx` convertido a Client (mínimo) con `useSidebarData()` para `hasAvatar`. `page.tsx` simplificado (`<ProfileSection showCertificates={...} />`). Commits `d3dd484 feat(user-settings): refactorizar perfil sobre primitivas compartidas`. `pnpm type-check` + `pnpm lint` + `pnpm mock:test` (59/59) en verde. |
| 2026-10-26 | Fase 3 / `page.tsx` → `getVisibleSections`      | Cerrado   | `page.tsx` migrado a `getVisibleSections(role)`. Nuevo `renderSection(id, showCertificates)` con `switch`; los `case`s de Fases 4 y 5 devuelven `null`. Eliminados `showSubscription`, `showCourses` y los placeholders JSX. `showCertificates` se deriva de `sections.includes('certificates')`. **Corrige bug de Fase 2:** `showCourses = student                                                                                                                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                               | teacher`ya no muestra Courses a teacher. Commit`refactor(user-settings): migrar orquestador a mapa sección × rol`. Validado: `pnpm type-check`(0),`pnpm lint`(0),`pnpm mock:test` (59/59). |
| 2026-10-26 | **Fase 3 ✅ CERRADA**                           | Cerrado   | Los 5 pasos de la Fase 3 (3.1 `PersonalDataSection`, 3.2 `PreferencesSection`, 3.3 `PrivacySection`, 3.4 `ProfileSection` refactor, 3.5 `page.tsx` → `getVisibleSections`) están cerrados y commiteados. Fase 3 completa. Siguiente: Fase 4 (Security).                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-28 | Fase 4 / `SecuritySection` + Overview           | Cerrado   | `SecuritySection` (Server) + `SecurityOverviewClient` (Client). Centraliza `useQuery(mySecuritySettings)` y `refetchSecurity` (network-only) para subcomponentes. Commit `5afe564`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-28 | Fase 4 / `ChangePasswordSection`                | Cerrado   | Formulario con `currentPassword`, `newPassword`, `confirmPassword` (cliente-only). Zod con `newPassword !== currentPassword`. `refetchSecurity` tras éxito (el backend revoca otras sesiones). Commit `8756368`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-10-28 | Fase 4 / `EmailChangeSection`                   | Cerrado   | Schema dinámico `requestEmailChangeSchema(currentEmail)` con refine "es tu correo actual". Sin refetch tras éxito (contrato §3.8: el email no cambia hasta confirmar el enlace). Commit `40c82a0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-28 | Fase 4 / `TwoFactorSection`                     | Cerrado   | Máquina de estados `idle \| verifying \| disabling`. `secret`/`qrCode` se descartan (no se renderizan, no se cachean). Botón "Desactivar" oculto si `twoFactorRequired === true` con badge "Obligatorio para tu rol". `refetchSecurity` tras verify/disable. Commit `c6ef2cc`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-28 | Fase 4 / `SessionsSection`                      | Cerrado   | Lista `mySecuritySettings.sessions` con badge "Actual" para la sesión actual (sin botón revocar). `<ConfirmDialog>` para revocar una o todas las demás. `refetchSecurity` tras éxito. Commit `b0fc86b`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-28 | **Fase 4 ✅ CERRADA (salvo 4.6)**               | Cerrado   | Los 5 subpasos implementables de la Fase 4 están cerrados y commiteados. El punto 4.6 (accesibilidad y focus management) se difiere a Fase 6. Siguiente: Fase 5 (secciones exclusivas de student).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-28 | Fase 5 / `UrqlProvider` (prerrequisito)         | Cerrado   | `7781616 refactor(urql): activar keys de Fase 5 y updates de removePaymentMethod`. Activa las keys diferidas de Fase 5 (`Certificate`, `PaymentMethod`, `Invoice`, `CourseEnrollment`) y `updates.Mutation.removePaymentMethod` (contrato §7, plan §8.2.23). `pnpm type-check` + `pnpm lint` en verde.                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-28 | Fase 5.1 / `AccountSection`                     | Cerrado   | `43ea6d2`. `AccountSection` (Server) + `AccountClient` (Client). Cuatro estados renderizados: `active`, `pending_deactivation`, `suspended`, `inactive`. Dos `<ConfirmDialog>` independientes. `useSectionMutation` con `parseVariables: () => ({})`; `Account` normaliza por la key `Account: () => 'me'`, sin refetch explícito (D-AD). Claves i18n en es/en. `pnpm type-check` + `pnpm lint` en verde.                                                                                                                                                                                                                                                                               |
| 2026-10-28 | Fase 5.2 / `CoursesSection`                     | Cerrado   | `5b6ca39`. `CoursesSection` (Server) + `CoursesClient` (Client). Solo lectura; cada curso enlaza a `/courses/{courseId}`. `<progress>` nativo con estilos webkit/moz contra las variables del tema. `completedAt` se estrecha de `unknown` a `string \| null` antes de usarlo en JSX. Claves i18n en es/en. `pnpm type-check` + `pnpm lint` en verde.                                                                                                                                                                                                                                                                                                                                   |
| 2026-10-28 | Fase 5.3 / `CertificatesSection`                | Cerrado   | `58a0862`. `CertificatesSection` (Server) + `CertificatesClient` (Client). **Refactor:** `CertificateEligibility` se mueve de `ProfileSection` a `CertificatesSection`. `ProfileSection` simplificado (avatar + form). `page.tsx` sin `showCertificates`. `downloadUrl` con `<a target="_blank" rel="noopener noreferrer">`. `issuedAt` estrechado de `unknown`. Claves i18n reorganizadas bajo `certificates.eligibility`. `pnpm type-check` + `pnpm lint` en verde.                                                                                                                                                                                                                   |
| 2026-10-28 | **Fase 5 ✅ CERRADA**                           | Cerrado   | Los 4 subpasos y el prerrequisito de infraestructura están cerrados y commiteados: `7781616` + `43ea6d2` + `5b6ca39` + `58a0862` + `d437fcd` + `0f25c40`. La sección `billing` se dividió en dos commits (lectura / mutaciones) para aislar la verificación del `updates.Mutation.removePaymentMethod` (primera activación real en Fase 5, verificada manualmente). Con Fase 5 cerrada, las 9 secciones del plan están implementadas. Siguiente: Fase 6 (endurecimiento).                                                                                                                                                                                                               |

---

## 10. Deuda técnica

Detectada al desbloquear el linter (ESLint 10 → 9 + TS 6/7 side-by-side).

> **Alcance:** toda la deuda listada abajo se resuelve en **Fase 1.5**,
> antes de arrancar Fase 2. Al cierre de 1.5, `pnpm lint` debe pasar con
> exit 0 y sin warnings. La Fase 2 arranca desde un estado base limpio.
> La estrategia de §10.3 queda como referencia histórica de cómo se
> detectó cada entrada; no describe el plan de resolución definitivo
> (que es 1.5).

### 10.1 Errores — `react-hooks/set-state-in-effect`

Patrón común: `setState` síncrono dentro de `useEffect`. React recomienda
resolverlo con `useSyncExternalStore`, refs, o moviendo el estado al render.
No bloquea la funcionalidad, pero afecta performance.

- `src/app/[locale]/(web)/(site)/(auth)/reset-password/[token]/Resetpasswordform.tsx:131`
- ✅ **Cerrada (paso 7, commit `d3dd484`):** `ProfileAvatarSettings.tsx:89`. Refactorizado sobre `useSectionMutation`; la imagen se deriva de `useSidebarData()` (sin `useState` + `useEffect` intermedio).
- `src/components/layout/dashboard/sidebar/Mobilenav.tsx:79`
- `src/components/ui/ThemeToggle/ThemeToggleClient.tsx:60`

**Deudas relacionadas de `ProfileAvatarSettings.tsx` saldadas en el mismo commit (`d3dd484`):**

- ✅ `router.refresh()` residual (dos llamadas, `handleSave` y `handleRemove`): eliminado. graphcache propaga `User.image` vía normalización de `SidebarData`.
- ✅ `useMutation` directo: migrado a `useSectionMutation` (patrón D-B/B1).
- ✅ `useEffect` de sincronización de `image` (que provocaba el `set-state-in-effect`): eliminado. `currentImage` se deriva directamente de `useSidebarData()`.

### 10.2 Warnings

- **Variables no usadas** con prefijo `_` en `Button.tsx` (16 casos).
- **Directivas `eslint-disable` obsoletas** en 4 archivos.
- **`react-hooks/incompatible-library`** en `ContactForm.tsx` por uso de
  `watch()` de react-hook-form (React Compiler no puede memoizar).
- **`<img>` en lugar de `next/image`** en `AvatarUploader.tsx`.

### 10.3 Estrategia de resolución

Se resolverán oportunamente cuando se toquen los archivos correspondientes
durante las fases de User Settings:

- `ProfileAvatarSettings.tsx` → Fase 3 (Profile).
- `Mobilenav.tsx` → Fase 3 o 4 (cuando se toque navegación).
- `ThemeToggleClient.tsx` → Fase 3 (Preferences).
- `ContactForm.tsx` → fuera de User Settings, cuando se toque contacto.
- `Button.tsx` → fuera de User Settings, cuando se toque UI compartida.

### 10.4 Deudas diferidas al cerrar Fase 2

Detectadas al implementar los 5 archivos de Fase 2. Ninguna bloquea Fase 3.

- **Variante `danger` en `Button.tsx`.** D-2 se resolvió en Fase 2 con
  `variant="primary"` + override `className="bg-danger hover:bg-danger-hover"`.
  Si en Fase 4/5 la semántica `danger` se repite en 3+ sitios (cancelar
  suscripción, revocar sesión, eliminar método de pago, cancelar
  desactivación), se añade la variante a `Button.tsx` en esa fase.
- **Animación de salida en `ConfirmDialog`.** D-C se resolvió sin animación
  de salida (solo entrada CSS). Si Fase 4/5 requiere paridad visual con
  `ForgotPasswordModal`, se añade `data-state="closed"` + `transitionend` +
  `dialog.close()` diferido, con tests manuales de Escape durante la
  animación.
- **Iconos semánticos por sección.** `user-settings-sections.ts` mapea a
  `UiIconName` existentes (`user`, `shield`, `sparkles`, `lockOpen`, `alert`,
  `checkCircle`, `star`, `crown`). `bookOpen` para Courses y `settings` para
  Preferences no existen en `IconMap.ui`. Si Fase 3 lo requiere, se añaden a
  `iconMap.tsx` (los consumidores no cambian: el tipo `UiIconName` se amplía).
- **`useSectionMutation` con `mutate` inestable si el consumidor pasa
  lambdas inline.** `useCallback` deps `[execute, parseVariables, mapError,
onSuccess]`. Si Fase 3 ve re-renders por `mutate` en deps de `useEffect`,
  se envuelve en `useEventCallback` o se documenta el patrón. No es un bug;
  es una fricción potencial.
````

### 10.5 Deudas de contrato abiertas al cerrar sub-fase 2 (Fase 3)

Detectadas al construir los schemas Zod de las secciones universales.
El cliente **ya decidió** la normalización; el contrato debe actualizarse
para reflejarla. El backend se ajusta al contrato, no al revés.

**Regla de normalización adoptada:** todo string de entrada a un schema
de User Settings se normaliza con `trim()` antes de validar. Motivo:
consistencia con `email`/`firstName`/`lastName` (donde el contrato ya lo
pide) y para que `"   "` no pase el `min(1)`. `timezone` es la única
excepción al `toLowerCase()` (es case-sensitive).

- **`trim()` en `profile.schema.ts` (`bio.title`, `bio.description`, `interests[i]`).**
  Contrato a actualizar: `docs/backend-api/_rutas/users-me/profile.md` §3.6.
- **`trim()` en `personal-data.schema.ts` (`documentId`, `phone`, `country`, `address`).**
  Contrato a actualizar: `docs/backend-api/_rutas/users-me/personal-data.md` §3.7.
- **`trim()` en `preferences.schema.ts` (`timezone`).**
  Contrato a actualizar: `docs/backend-api/_rutas/users-me/preferences.md` §8.2.16.

**Cómo se resuelven:** actualizando los 3 archivos del contrato para
documentar el `trim()` en los campos listados. El código del cliente ya
lo aplica (`TODO(contract)` en cada schema). El backend debe recibir el
valor normalizado y aplicar la misma normalización como defensa en
profundidad. No requiere cambios de código en el cliente.

### 10.6 Deudas detectadas en sub-fase 3 (i18n)

Anotadas al cerrar la sub-fase 3. Ninguna bloquea Fase 3.

- **`pages.subscription.{title,monthly,yearly}` asimétrico es/en.**
  `es.json` tiene el bloque `pages.subscription` (heredado del scaffold inicial),
  `en.json` no lo tiene. No tiene consumidores: la página `/subscription` usa
  `subscription.plans.*`, no `pages.subscription.*`. Se resolverá en Fase 6
  (endurecimiento) o cuando se toque `pages.*` por otro motivo.
- **Nota (no deuda): `Validation.contact.phone.invalid` vs. `Validation.phone.invalid`.**
  Coexisten dos claves de "teléfono inválido": la de contacto (`contact.phone.invalid`)
  y la de datos personales (`phone.invalid`). Los schemas emiten claves
  distintas, así que `resolveError` las resuelve por separado. Se anota para
  evitar confusión al buscar `phone` en el JSON.
- **Sidebar del dashboard no sticky.** Al hacer scroll en páginas con
  contenido largo, el sidebar se va hacia arriba. Fix pendiente en Fase 6+:
  `sticky top-0` en el `<aside>` de `SidebarShell.tsx`, o mover el scroll
  al `<main>` (`overflow-y-auto h-screen`). `TODO(dashboard-layout)` en
  `dashboard/layout.tsx`. No bloquea Fase 3.
- **`timezone` como `<input type="text">` libre.** El usuario tiene que
  escribir el identificador IANA a mano. `TODO(timezone-select)` en
  `PreferencesFormClient.tsx`. Diferido a Fase 6+ con `src/config/timezones.ts`
  (catálogo IANA) y `<select>`.

  ### 10.7 Deudas detectadas al cerrar Fase 4 (Security)

Anotadas al cerrar los 5 subpasos. Ninguna bloquea Fase 5.

- **TODO(graphcache-security)** — Ya previsto en el prompt de rol v4.2. Hoy usamos `refetch` `network-only` centralizado en `SecurityOverviewClient` para todas las mutaciones que no normalizan (`changePassword`, `verifyTwoFactorSetup`, `disableTwoFactor`, `revokeSession`, `revokeOtherSessions`). Revisar en Fase 6 si conviene migrar a `updates` explícitos por rendimiento.
- **TODO(mock-2fa-teacher)** — El mock actual no permite probar el caso `twoFactorRequired === true` desde la UI (no hay usuario `teacher`/`admin` con `twoFactorRequired: true` en el mock). Añadir en Fase 6 si se quiere test manual end-to-end.
- **TODO(mock-changePassword-login)** — El mock permite loguearse con cualquier email/password (salvo `invalid@example.com` / `wrong-password`) pero `changePassword` exige `currentPassword: 'old-password'`. Puede confundir en QA manual. Alinear en Fase 6 si molesta.
- **TODO(email-change-confirm-ui)** — La UI de `EmailChangeSection` no indica "verificación pendiente" tras `requestEmailChange`. El contrato §3.8 dice que el email no cambia hasta confirmar el enlace, pero no expone `pendingEmail` en `SecuritySettings`. Anotado también en §8.1. Fase 6+ o cuando el backend lo soporte.
- **Punto 4.6 (accesibilidad y focus management en modales)** — Diferido a Fase 6 (hardening). `ConfirmDialog` ya maneja focus trap, Escape y restauración de foco nativos; falta revisar `aria-busy`, `role="alert"` en feedbacks y `aria-live` en el flujo multi-paso de 2FA.

### 10.8 Deudas detectadas al cerrar Fase 5 (Account, Courses, Certificates, Billing)

Anotadas al cerrar los 4 subpasos y el prerrequisito de la Fase 5. Ninguna bloquea Fase 6.

- **TODO(amount-units)** — En `InvoicesClient.tsx` (5.4.a), `amount` se divide entre 100 asumiendo que la moneda tiene 2 decimales (COP, USD, EUR). El contrato §7 dice "entero en la unidad menor de la moneda", pero no todas las monedas tienen 2 decimales (JPY, KRW: 0). Cuando aparezca una moneda sin decimales o cuando el contrato exponga los decimales de la moneda, extraer un helper por moneda. Hoy no hay consumidor con moneda sin decimales (el mock usa COP), pero la deuda queda anotada con el `TODO(amount-units)` en el código.
- **TODO(reactivar-suscripcion)** — En `SubscriptionClient.tsx` (5.4.b), si `cancelAtPeriodEnd === true` mostramos el aviso "tu suscripción se cancelará el {fecha}" pero **no** ofrecemos botón "Reactivar". El plan §5.9.6 lo menciona como opcional ("si el backend lo soporta"), pero el contrato §6 no lo define. Revisar con el backend en Fase 6.
- **TODO(plan-selector-sticky)** — En `SubscriptionClient.tsx` (5.4.b), el `<select>` de cambio de plan está siempre visible junto al botón "Cambiar plan". Si la sección crece (3 sub-bloques con formularios + confirmaciones), evaluar si conviene mover el `<select>` a un `<ConfirmDialog>` con el selector dentro (patrón compacto) o dejarlo como está. No es bug, es decisión de UX diferida.
- **TODO(invoice-download-signed-url)** — En `InvoicesClient.tsx` (5.4.a), si `downloadUrl` es null no se muestra link. Cuando el backend exponga URL firmada siempre, la UI puede asumir no-null y simplificar. Hasta entonces, la UI maneja el caso null correctamente.
- **TODO(certificates-eligibility-real-check)** — En `CertificateEligibility.tsx` (cerrado en Fase 3, movido en 5.3), los requisitos "Datos personales completos" y "Cuenta verificada" siguen con `comingSoon: true`. Ahora que existen `PersonalDataSection` (Fase 3) y `SecuritySection` (Fase 4), se puede cruzar la información real para computar esos dos requisitos. Fase 6 o un pase posterior.
- **TODO(sidebar-sticky)** — Heredado de §10.6. La sección `billing` es larga (3 sub-bloques) y reabre la visibilidad del problema: con scroll, el sidebar del dashboard se va hacia arriba. `TODO(dashboard-layout)` en `dashboard/layout.tsx`. Fase 6.

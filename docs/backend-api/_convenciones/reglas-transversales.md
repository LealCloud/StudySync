---
kind: convention
source_legacy: '§9'
contract_version: v1.3.1
---

# Reglas transversales

Reglas que aplican a todo el contrato.

---

1. **`/users/me` depende del token.** El backend identifica al usuario por el Access Token. Nunca debe aceptar un `userId` para decidir quién es el usuario actual.

2. **Autorización en el backend.** El BFF puede bloquear operaciones antes, pero el backend debe validar nuevamente autenticación y autorización.

3. **`PATCH` es una actualización parcial.** La semántica es transversal a todo el contrato:

   | Valor enviado               | Efecto                                                               |
   | :-------------------------- | :------------------------------------------------------------------- |
   | Campo omitido (`undefined`) | El backend **no modifica** el campo.                                 |
   | `null`                      | El backend **borra** el valor del campo (lo deja vacío / sin valor). |
   | Valor concreto              | El backend **asigna** ese valor.                                     |

   Las excepciones (campos que no aceptan `null`, o que lo tratan distinto) se documentan explícitamente en la sección del endpoint. Ejemplo vigente: `PATCH /users/me/preferences` no admite `null` (ver [`_rutas/users-me/preferences.md`](../_rutas/users-me/preferences.md)).

   Por ejemplo:

   ```json
   {
     "notifications": {
       "push": false
     }
   }
   ```

   no debe modificar:

   ```text
   notifications.email
   notifications.inApp
   ```

   La respuesta debe devolver el objeto completo.

4. **`identityLocked` nunca lo envía el cliente.** Es únicamente un campo de respuesta.

5. **Datos de pago.** Solo se exponen:

   ```text
   id
   brand
   last4
   expirationMonth
   expirationYear
   ```

   Nunca se devuelven número completo de tarjeta, CVV ni equivalentes.

6. **Secreto de 2FA.** El `secret` de `two-factor/setup` es sensible:

   - no se guarda en logs;
   - no se envía a analítica;
   - no se incluye en otras respuestas.

7. **Formatos.**

   Los IDs son `string`.

   Las fechas utilizan ISO 8601:

   ```text
   2026-10-04T18:30:00Z
   ```

   Si un campo puede no tener valor, se devuelve explícitamente como `null`, nunca alternando entre `null` y `""`.

8. **Headers.**

   Las peticiones JSON utilizan:

   ```http
   Content-Type: application/json
   Accept: application/json
   ```

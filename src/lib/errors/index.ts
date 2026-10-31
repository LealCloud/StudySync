// Re-exports públicos de los códigos de error y helpers del contrato
// BACKEND_API.md (v1.3).
// Los consumidores pueden importar desde '@/lib/errors' en lugar de
// rutas profundas. Internamente los archivos siguen organizados por dominio.

// Códigos comunes a todas las rutas API + helper de lectura
export * from './api-errors';

// Dominio: sitio público (login, register, forgot, reset)
export * from './auth-errors';

// Dominio: formulario de contacto
export * from './contact-errors';

// Futuros (Fases 4 y 5):
// export * from './security-errors';   // EMAIL_TAKEN, EMAIL_UNCHANGED, SESSION_IS_CURRENT, INVALID_CODE, INVALID_CURRENT_PASSWORD
// export * from './billing-errors';    // PAYMENT_METHOD_REQUIRED

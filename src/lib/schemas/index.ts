// Re-exports públicos de los schemas Zod y helpers de validación.
// Los consumidores pueden importar desde '@/lib/schemas' en lugar de
// rutas profundas. Internamente los archivos siguen organizados por dominio.

// Primitivas y catálogos del contrato BACKEND_API.md (v1.3)
export * from './primitives';

// Fields reutilizables (fragmentos Zod)
export * from './fields/auth';

// Auth
export * from './auth/login.schema';
export * from './auth/register.schema';
export * from './auth/forgot-password.schema';
export * from './auth/reset-password.schema';

// Contact
export * from './contact/contact.schema';

// User Settings
export * from './user-settings/profile.schema';
export * from './user-settings/personal-data.schema';
export * from './user-settings/preferences.schema';
export * from './user-settings/privacy.schema';
export * from './user-settings/security.schema';

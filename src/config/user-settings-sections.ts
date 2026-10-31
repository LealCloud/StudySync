import type { UiIconName } from '@/lib/iconMap';
import type { UserRole } from '@/types/user';

/* ============================================================
   MAPA SECCIÓN × ROL — User Settings
   ============================================================

   Fuente única de verdad de qué secciones existen, qué roles
   pueden verlas y en qué orden se renderizan en el orquestador.

   Referencias:
   - Plan §3.1: matriz sección × rol.
   - Contrato §10 (autorización por rol): la autorización real vive
     en el BFF (`requireRole`), este mapa solo controla visibilidad.
   - Plan D4: orden de secciones.

   Regla: si una sección no está en el mapa, no existe para la UI.
   El mapa NO reemplaza la autorización del BFF; la refleja.
   ============================================================ */

export const USER_SETTINGS_SECTIONS = {
  profile: {
    roles: ['student', 'teacher', 'admin'],
    icon: 'user',
    order: 1,
  },
  personalData: {
    roles: ['student', 'teacher', 'admin'],
    icon: 'user',
    order: 2,
  },
  security: {
    roles: ['student', 'teacher', 'admin'],
    icon: 'shield',
    order: 3,
  },
  preferences: {
    roles: ['student', 'teacher', 'admin'],
    icon: 'sparkles',
    order: 4,
  },
  privacy: {
    roles: ['student', 'teacher', 'admin'],
    icon: 'lockOpen',
    order: 5,
  },
  account: {
    // Solo student: teacher/admin gestionan su baja por admin/TI
    // (plan §3.3, contrato §10).
    roles: ['student'],
    icon: 'alert',
    order: 6,
  },
  courses: {
    // Solo student: el BFF bloquea con 403 a teacher/admin
    // (`coursesResolvers` → `requireRole(c, ['student'])`).
    // El orquestador actual (`showCourses = student || teacher`) está
    // desalineado con esta verdad canónica; se corrige en Fase 3.
    roles: ['student'],
    icon: 'checkCircle',
    order: 7,
  },
  certificates: {
    // Solo student: idem courses.
    roles: ['student'],
    icon: 'star',
    order: 8,
  },
  billing: {
    // Solo student: idem courses.
    roles: ['student'],
    icon: 'crown',
    order: 9,
  },
} as const satisfies Record<
  string,
  {
    roles: readonly UserRole[];
    icon: UiIconName;
    order: number;
  }
>;

export type UserSettingsSectionId = keyof typeof USER_SETTINGS_SECTIONS;

/* ============================================================
   HELPERS DERIVADOS DEL MAPA
   ============================================================ */

/**
 * Devuelve las secciones visibles para un rol, ordenadas por `order`.
 * El orquestador (Fase 3) consume esta función en lugar de replicar
 * la lógica de `showCourses`/`showCertificates`/etc. a mano.
 */
export function getVisibleSections(role: UserRole): UserSettingsSectionId[] {
  return (Object.keys(USER_SETTINGS_SECTIONS) as UserSettingsSectionId[])
    .filter((id) =>
      (USER_SETTINGS_SECTIONS[id].roles as readonly UserRole[]).includes(role),
    )
    .sort(
      (a, b) =>
        USER_SETTINGS_SECTIONS[a].order - USER_SETTINGS_SECTIONS[b].order,
    );
}

/**
 * Verifica si una sección es visible para un rol.
 * Útil para renderizado condicional puntual sin construir la lista.
 */
export function isSectionVisible(
  role: UserRole,
  id: UserSettingsSectionId,
): boolean {
  return (USER_SETTINGS_SECTIONS[id].roles as readonly UserRole[]).includes(
    role,
  );
}

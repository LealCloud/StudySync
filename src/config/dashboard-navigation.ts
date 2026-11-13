// Configuración de la navegación del dashboard por rol.
//
// Convención: todos los `path` de los menús viven bajo `/dashboard/...`,
// coherente con la estructura de `src/app/[locale]/(web)/dashboard/`.
// El `SidebarNav` y `MobileNav` usan `Link` de `@/i18n/navigation`, que
// resuelve rutas absolutas con el prefijo de locale.
import { DashboardIconName } from '@/lib/iconMap';
import type { UserRole } from '@/types/next-auth';

export interface NavItem {
  label: string;
  path: string;
  icon: DashboardIconName;
}

/* =========================================================
   1. MENÚ ESTUDIANTE
   ========================================================= */
export const studentMenu: NavItem[] = [
  {
    label: 'courses',
    path: '/dashboard/courses',
    icon: 'bookOpen',
  },
  {
    label: 'studyRooms',
    path: '/dashboard/rooms',
    icon: 'video',
  },
  {
    label: 'calendar',
    path: '/dashboard/calendar',
    icon: 'calendar',
  },
  {
    label: 'messages',
    path: '/dashboard/messages',
    icon: 'message',
  },
  {
    label: 'academicManagement',
    path: '/dashboard/academic-management',
    icon: 'clipboard',
  },
  {
    label: 'pomodoro',
    path: '/dashboard/pomodoro',
    icon: 'timer',
  },
];

/* =========================================================
   2. MENÚ PROFESOR
   ========================================================= */
export const professorMenu: NavItem[] = [
  {
    label: 'courses',
    path: '/dashboard/courses',
    icon: 'bookOpen',
  },
  {
    label: 'studyRooms',
    path: '/dashboard/rooms',
    icon: 'video',
  },
  {
    label: 'calendar',
    path: '/dashboard/calendar',
    icon: 'calendar',
  },
  {
    label: 'messages',
    path: '/dashboard/messages',
    icon: 'message',
  },
  {
    label: 'academicManagement',
    path: '/dashboard/academic-management',
    icon: 'clipboard',
  },
  {
    label: 'students',
    path: '/dashboard/students',
    icon: 'users',
  },
];

/* =========================================================
   3. MENÚ ADMINISTRADOR
   ========================================================= */
export const adminMenu: NavItem[] = [
  {
    label: 'users',
    path: '/dashboard/users',
    icon: 'users',
  },
  {
    label: 'professors',
    path: '/dashboard/professors',
    icon: 'graduationCap',
  },
  {
    label: 'students',
    path: '/dashboard/students-admin',
    icon: 'userCog',
  },
  {
    label: 'courses',
    path: '/dashboard/courses-admin',
    icon: 'bookOpen',
  },
  {
    label: 'academicCenter',
    path: '/dashboard/academic-center',
    icon: 'clipboard',
  },
  {
    label: 'rooms',
    path: '/dashboard/rooms',
    icon: 'video',
  },
  {
    label: 'reportsAudit',
    path: '/dashboard/reports',
    icon: 'barChart',
  },
];

export function getRoleTranslationKey(
  role: UserRole | null,
): 'admin' | 'professor' | 'student' {
  if (role === 'admin') return 'admin';
  if (role === 'teacher') return 'professor';
  return 'student';
}

/* =========================================================
   UTILIDAD DE CONFIGURACIÓN POR ROL
   ========================================================= */
export function getRoleNavigation(role: UserRole | string | null | undefined) {
  const normalized = String(role ?? '')
    .trim()
    .toLowerCase();

  if (normalized === 'admin') {
    return {
      type: 'admin' as const,
      menu: adminMenu,
      dashboardPath: '/dashboard',
      panelTitle: 'Panel del administrador',
      roleLabel: 'Administrador',
    };
  }

  if (normalized === 'teacher') {
    return {
      type: 'professor' as const,
      menu: professorMenu,
      dashboardPath: '/dashboard',
      panelTitle: 'Panel del profesor',
      roleLabel: 'Profesor',
    };
  }

  // 'student' o cualquier valor no reconocido → estudiante por defecto
  return {
    type: 'student' as const,
    menu: studentMenu,
    dashboardPath: '/dashboard',
    panelTitle: 'Panel del estudiante',
    roleLabel: 'Estudiante',
  };
}

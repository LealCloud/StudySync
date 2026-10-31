// dashboard-navigation.ts
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
    path: '/courses',
    icon: 'bookOpen',
  },
  {
    label: 'studyRooms',
    path: '/rooms',
    icon: 'video',
  },
  {
    label: 'calendar',
    path: '/calendar',
    icon: 'calendar',
  },
  {
    label: 'messages',
    path: '/messages',
    icon: 'message',
  },
  {
    label: 'academicManagement',
    path: '/academic-management',
    icon: 'clipboard',
  },
  {
    label: 'pomodoro',
    path: '/pomodoro',
    icon: 'timer',
  },
];

/* =========================================================
   2. MENÚ PROFESOR
   ========================================================= */
export const professorMenu: NavItem[] = [
  {
    label: 'courses',
    path: '/courses',
    icon: 'bookOpen',
  },
  {
    label: 'studyRooms',
    path: '/rooms',
    icon: 'video',
  },
  {
    label: 'calendar',
    path: '/calendar',
    icon: 'calendar',
  },
  {
    label: 'messages',
    path: '/messages',
    icon: 'message',
  },
  {
    label: 'academicManagement',
    path: '/academic-management',
    icon: 'clipboard',
  },
  {
    label: 'students',
    path: '/students',
    icon: 'users',
  },
];

/* =========================================================
   3. MENÚ ADMINISTRADOR
   ========================================================= */
export const adminMenu: NavItem[] = [
  {
    label: 'users',
    path: '/users',
    icon: 'users',
  },
  {
    label: 'professors',
    path: '/professors',
    icon: 'graduationCap',
  },
  {
    label: 'students',
    path: '/students-admin',
    icon: 'userCog',
  },
  {
    label: 'courses',
    path: '/courses-admin',
    icon: 'bookOpen',
  },
  {
    label: 'academicCenter',
    path: '/academic-center',
    icon: 'clipboard',
  },
  {
    label: 'rooms',
    path: '/rooms',
    icon: 'video',
  },
  {
    label: 'reportsAudit',
    path: '/reports',
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
      dashboardPath: '/dashboard-admin',
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
    dashboardPath: '/dashboard-estudiante',
    panelTitle: 'Panel del estudiante',
    roleLabel: 'Estudiante',
  };
}

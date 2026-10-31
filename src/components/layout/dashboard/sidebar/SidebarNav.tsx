'use client';

import { getRoleNavigation } from '@/config/dashboard-navigation';
import type { NavItem } from '@/config/dashboard-navigation';
import { IconMap } from '@/lib/iconMap';
import { cn } from '@/utilities/cn';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useSidebar } from './SidebarContext';
import { useSidebarData } from './useSidebarData';

type IconComponentType = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

// Función auxiliar para buscar el icono de forma segura sin usar 'any'
function getIconComponent(iconName: NavItem['icon']): IconComponentType | null {
  for (const group of Object.values(IconMap)) {
    if (group && typeof group === 'object' && iconName in group) {
      const found = (group as Record<string, unknown>)[iconName];
      if (
        typeof found === 'function' ||
        (typeof found === 'object' && found !== null)
      ) {
        return found as IconComponentType;
      }
    }
  }
  return null;
}

export default function SidebarNav() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const { isLoading, role } = useSidebarData();
  const t = useTranslations('dashboard.navigation');
  const navConfig = getRoleNavigation(role);
  const items = navConfig.menu.map((item) => ({
    ...item,
    label: t(`items.${item.label}`),
  }));

  if (isLoading) {
    return (
      <div className="grid gap-1.5 px-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="bg-surface-hover h-11.5 animate-pulse rounded-[13px]"
          />
        ))}
      </div>
    );
  }

  if (role === null) return null;

  return (
    <nav
      className="grid gap-1.5 px-3"
      aria-label={t(`panel.${navConfig.type}`)}
    >
      {items.map((item) => {
        const IconComponent = getIconComponent(item.icon);
        // Prefijo con '/' para que '/students' no active '/students-admin'
        const isActive =
          pathname === item.path || pathname.startsWith(`${item.path}/`);

        return (
          <Link
            key={item.path}
            href={item.path}
            title={collapsed ? item.label : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'text-foreground-muted hover:border-border hover:bg-surface-hover hover:text-foreground flex min-h-11.5 items-center gap-3 overflow-hidden rounded-[13px] border border-transparent px-3.5 text-sm leading-tight font-bold whitespace-nowrap transition-all duration-200',
              collapsed && 'justify-center px-0',
              isActive &&
                'border-border-focus bg-surface-active text-foreground hover:border-border-focus hover:bg-surface-active',
            )}
          >
            {IconComponent && (
              <IconComponent className="text-foreground shrink-0" size={19} />
            )}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

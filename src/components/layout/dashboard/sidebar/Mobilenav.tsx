'use client';

import { getRoleNavigation, type NavItem } from '@/config/dashboard-navigation';
import { IconMap } from '@/lib/iconMap';
import { cn } from '@/utilities/cn';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import MoreSheet from './Moresheet';
import { useSidebarData } from './useSidebarData';

interface MobileNavProps {
  homePath: string;
  homeLabel: string;
  labels: {
    navigationLabel: string;
    more: string;
    moreOptions: string;
    theme: string;
    signOut: string;
  };
}

// Cantidad total de accesos directos visibles (incluye "Inicio") antes de agrupar en "Más"
const MAX_PRIMARY_ITEMS = 4;

// En escritorio el logo enlaza a la raíz del dashboard; en mobile no hay logo
// visible en la barra, así que reservamos el primer slot para ese acceso.
type IconComponentType = React.ComponentType<{
  size?: number;
  className?: string;
}>;

// Misma estrategia de búsqueda de icono que SidebarNav.tsx
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

export default function MobileNav({
  homePath,
  homeLabel,
  labels,
}: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isLoading, role } = useSidebarData();
  const t = useTranslations('dashboard.navigation');
  const items = getRoleNavigation(role).menu.map((item) => ({
    ...item,
    label: t(`items.${item.label}`),
  }));

  // Evita un duplicado si algún día el propio menú del rol define '/dashboard'
  const homeItem: NavItem = {
    label: homeLabel,
    path: homePath,
    icon: 'graduationCap',
  };
  const roleItems = items.filter((item) => item.path !== homeItem.path);
  const maxRoleItems = MAX_PRIMARY_ITEMS - 1; // 1 slot reservado para "Inicio"

  const primaryItems = [homeItem, ...roleItems.slice(0, maxRoleItems)];
  const moreItems = roleItems.slice(maxRoleItems);

  // Cierra el panel "Más" al navegar.
  // TODO(fase-3): sustituir por `onNavigate` pasado al `<Link>` de cada item
  // (mismo patrón que `MoreSheet`), eliminando la dependencia del pathname y
  // el `setState` síncrono en efecto.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierre por cambio de ruta, se reemplaza por onNavigate en Fase 3
    setOpen(false);
  }, [pathname]);

  // Bloquea el scroll de fondo mientras el panel está abierto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const isItemActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  if (isLoading) {
    return (
      <div
        className="border-border bg-background fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t px-2 lg:hidden"
        aria-hidden="true"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="bg-surface-hover h-10 w-12 animate-pulse rounded-xl"
          />
        ))}
      </div>
    );
  }

  if (role === null) return null;

  return (
    <>
      <nav
        aria-label={labels.navigationLabel}
        className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {primaryItems.map((item) => {
          const Icon = getIconComponent(item.icon);
          const active = isItemActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1"
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-xl transition-colors duration-200',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-muted',
                )}
              >
                {Icon && <Icon size={20} />}
              </span>
              <span
                className={cn(
                  'max-w-16 truncate text-[10px] leading-none font-semibold',
                  active ? 'text-primary' : 'text-foreground-muted',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {moreItems.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1"
          >
            <span
              className={cn(
                'grid size-9 place-items-center rounded-xl transition-colors duration-200',
                open ? 'bg-primary/10 text-primary' : 'text-foreground-muted',
              )}
            >
              <HiEllipsisHorizontal size={22} />
            </span>
            <span
              className={cn(
                'text-[10px] leading-none font-semibold',
                open ? 'text-primary' : 'text-foreground-muted',
              )}
            >
              {labels.more}
            </span>
          </button>
        )}
      </nav>

      <MoreSheet
        open={open}
        onClose={() => setOpen(false)}
        isItemActive={isItemActive}
        labels={labels}
      />
    </>
  );
}

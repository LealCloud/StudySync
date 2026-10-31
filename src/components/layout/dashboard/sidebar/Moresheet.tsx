'use client';

import { Button } from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle/ThemeToggle';
import type { NavItem } from '@/config/dashboard-navigation';
import {
  getRoleNavigation,
  getRoleTranslationKey,
} from '@/config/dashboard-navigation';
import { IconMap } from '@/lib/iconMap';
import { cn } from '@/utilities/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useSidebarData } from './useSidebarData';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  isItemActive: (path: string) => boolean;
  labels: { moreOptions: string; theme: string; signOut: string };
}

type IconComponentType = React.ComponentType<{
  size?: number;
  className?: string;
}>;

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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function MoreSheet({
  open,
  onClose,
  isItemActive,
  labels,
}: MoreSheetProps) {
  const { isLoading, name, email, image, role } = useSidebarData();
  const t = useTranslations('dashboard.navigation');
  const items = getRoleNavigation(role).menu.map((item) => ({
    ...item,
    label: t(`items.${item.label}`),
  }));
  const roleLabel = t(`roles.${getRoleTranslationKey(role)}`);

  if (isLoading) return null;

  const userName = name ?? '';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay: cierra al hacer clic fuera */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel deslizante */}
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={labels.moreOptions}
            className="border-border bg-surface fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t shadow-2xl lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            {/* Manija visual de arrastre */}
            <div className="flex justify-center pt-3 pb-1">
              <span className="bg-border h-1.25 w-10 rounded-full" />
            </div>

            {/* Perfil del usuario */}
            <Link
              href="/dashboard/user-settings"
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-4"
            >
              {image ? (
                <Image
                  src={image}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="border-border h-11 w-11 shrink-0 rounded-full border object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                >
                  {getInitials(userName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-bold">
                  {userName}
                </p>
                <p className="text-foreground-muted truncate text-xs">
                  {roleLabel} · {email ?? ''}
                </p>
              </div>
            </Link>

            {/* Opciones secundarias del rol */}
            {items.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 px-5 pt-2 pb-4">
                {items.map((item) => {
                  const Icon = getIconComponent(item.icon);
                  const active = isItemActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={onClose}
                      className={cn(
                        'border-border bg-background flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center',
                        active && 'border-border-focus bg-surface-active',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-10 place-items-center rounded-xl',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary/10 text-foreground-muted',
                        )}
                      >
                        {Icon && <Icon size={19} />}
                      </span>
                      <span className="text-foreground text-xs leading-tight font-semibold">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Preferencias y sesión */}
            <div className="border-border flex items-center justify-between gap-3 border-t px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-foreground-muted text-xs font-semibold">
                  {labels.theme}
                </span>
                <ThemeToggle size="sm" />
              </div>

              <Button
                variant="ghost"
                size="md"
                icon="arrowRightOnRectangle"
                className="hover:text-danger"
                onClick={() => signOut()}
              >
                {labels.signOut}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

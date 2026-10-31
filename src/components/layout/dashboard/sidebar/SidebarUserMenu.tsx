'use client';

import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/utilities/cn';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getRoleTranslationKey } from '@/config/dashboard-navigation';
import { useSidebar } from './SidebarContext';
import { useSidebarData } from './useSidebarData';

interface SidebarUserMenuProps {
  signOutLabel: string;
}

export default function SidebarUserMenu({
  signOutLabel,
}: SidebarUserMenuProps) {
  const { collapsed } = useSidebar();
  const { isLoading, name, email, image, role } = useSidebarData();
  const t = useTranslations('dashboard.navigation');

  if (isLoading) return null;

  const userName = name ?? '';
  const roleLabel = t(`roles.${getRoleTranslationKey(role)}`);

  return (
    <div
      className={cn(
        'border-border flex flex-col gap-3 overflow-hidden border-t p-3',
        collapsed && 'items-center px-0',
      )}
    >
      {/* Avatar + datos */}
      <Link
        href="/dashboard/user-settings"
        className={cn('flex items-center gap-3', collapsed && 'justify-center')}
        title={collapsed ? `${userName} · ${roleLabel}` : undefined}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={40}
            height={40}
            unoptimized
            referrerPolicy="no-referrer"
            className="border-border h-10 w-10 shrink-0 rounded-full border object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          ></span>
        )}

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm leading-tight font-bold">
              {userName}
            </p>
            <p className="text-foreground-subtle truncate text-xs">
              {email ?? ''}
            </p>
            <p className="text-foreground-muted truncate text-xs font-medium">
              {roleLabel}
            </p>
          </div>
        )}
      </Link>

      {/* Tema + cierre de sesión */}
      <div
        className={cn(
          'flex items-center gap-2',
          collapsed ? 'flex-col' : 'justify-between',
        )}
      >
        <Button
          variant="ghost"
          size="md"
          icon="arrowRightOnRectangle"
          aria-label={signOutLabel}
          title={collapsed ? signOutLabel : undefined}
          fullWidth={!collapsed}
          onClick={() => signOut()}
          className={cn(
            collapsed ? 'w-10 px-0' : 'flex-1 justify-start px-3',
            'hover:text-danger',
          )}
        >
          {!collapsed && <span>{signOutLabel}</span>}
        </Button>
      </div>
    </div>
  );
}

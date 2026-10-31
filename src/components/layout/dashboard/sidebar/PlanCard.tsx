'use client';

import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { IconMap, type UiIconName } from '@/lib/iconMap';
import type { SubscriptionType } from '@/types/user';
import { cn } from '@/utilities/cn';
import { useTranslations } from 'next-intl';
import { useSidebar } from './SidebarContext';
import { useSidebarData } from './useSidebarData';

interface PlanConfig {
  icon: UiIconName;
  card: string;
  tile: string;
  cta?: { href: string };
}

const PLANS: Record<SubscriptionType, PlanConfig> = {
  free: {
    icon: 'sparkles',
    card: 'border-border bg-surface',
    tile: 'bg-secondary text-secondary-foreground',
    cta: {
      href: '/dashboard/checkout?plan=premium' /* TODO: Ruta sin gestionar */,
    },
  },
  premium: {
    icon: 'crown',
    card: 'border-warning/30 bg-warning/10',
    tile: 'bg-warning text-warning-foreground',
    cta: {
      href: '/dashboard/billing' /* TODO: Implementar ruta de gestión de facturación/métodos de pago */,
    },
  },
  enterprise: {
    icon: 'gem',
    card: 'border-primary/30 bg-primary/10',
    tile: 'bg-primary text-primary-foreground',
  },
};

export default function PlanCard() {
  const { collapsed } = useSidebar();
  const { isLoading, plan: subscription } = useSidebarData();
  const t = useTranslations('dashboard.sidebar');

  if (isLoading || subscription === null) return null;

  const plan = PLANS[subscription];
  const planMessages = {
    name: t(`plans.${subscription}.name`),
    description: t(`plans.${subscription}.description`),
  };
  const ctaLabel =
    subscription === 'free' ? t('actions.upgrade') : t('actions.manage');
  const Icon = IconMap.ui[plan.icon];

  // Versión colapsada: solo el icono
  if (collapsed) {
    const tile = (
      <div
        className={cn(
          'flex size-11 items-center justify-center rounded-xl',
          plan.tile,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
    );

    return (
      <div className="flex justify-center px-3">
        {plan.cta ? (
          <Link
            href={plan.cta.href}
            aria-label={`${planMessages.name}: ${ctaLabel}`}
            title={`${planMessages.name}: ${ctaLabel}`}
            className="focus-visible:outline-border-focus rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {tile}
          </Link>
        ) : (
          <div
            role="img"
            aria-label={planMessages.name}
            title={planMessages.name}
          >
            {tile}
          </div>
        )}
      </div>
    );
  }

  // Versión expandida: tarjeta completa
  return (
    <div className="px-3">
      <div className={cn('rounded-2xl border p-4', plan.card)}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              plan.tile,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-foreground-subtle text-xs">{t('currentPlan')}</p>
            <p className="text-foreground truncate text-sm font-semibold">
              {planMessages.name}
            </p>
          </div>
        </div>

        <p className="text-foreground-muted mt-3 text-xs">
          {planMessages.description}
        </p>

        {plan.cta && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            href={plan.cta.href}
            icon="arrowRight"
            iconPosition="right"
            className="mt-3"
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

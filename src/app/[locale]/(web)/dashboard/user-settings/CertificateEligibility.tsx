'use client';

import { useSidebarData } from '@/components/layout/dashboard/sidebar/useSidebarData';
import { AppIcon, type UiIconName } from '@/lib/iconMap';

interface Requirement {
  label: string;
  met: boolean;
  /** Requisito planeado pero que aún no se puede validar (sección no construida). */
  comingSoon?: boolean;
}

interface CertificateEligibilityProps {
  messages: {
    title: string;
    description: string;
    eligible: string;
    pending: string;
    avatar: string;
    personalData: string;
    verified: string;
    comingSoon: string;
  };
}

export function CertificateEligibility({
  messages,
}: CertificateEligibilityProps) {
  const { image } = useSidebarData();
  const hasAvatar = !!image;

  // TODO: sumar acá los requisitos reales de "Personal Data" y "Security"
  // en cuanto existan (ej: datos completos, cuenta verificada).
  const requirements: Requirement[] = [
    { label: messages.avatar, met: hasAvatar },
    { label: messages.personalData, met: false, comingSoon: true },
    { label: messages.verified, met: false, comingSoon: true },
  ];

  const enforced = requirements.filter((r) => !r.comingSoon);
  const isEligible = enforced.every((r) => r.met);

  return (
    <section className="border-border bg-surface rounded-3xl border p-6 sm:p-8">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {messages.title}
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">
            {messages.description}
          </p>
        </div>
        <span
          className={
            isEligible
              ? 'border-success/20 bg-success/10 text-success inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold'
              : 'border-warning/20 bg-warning/10 text-warning inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold'
          }
        >
          <AppIcon
            category="ui"
            name={isEligible ? 'checkCircle' : 'alert'}
            className="size-3.5"
          />
          {isEligible ? messages.eligible : messages.pending}
        </span>
      </header>

      <ul className="grid gap-2">
        {requirements.map((req) => (
          <li
            key={req.label}
            className="border-border bg-background flex items-center gap-3 rounded-xl border p-3"
          >
            <RequirementIcon met={req.met} comingSoon={req.comingSoon} />
            <span
              className={
                req.comingSoon
                  ? 'text-foreground-subtle text-sm'
                  : 'text-foreground text-sm font-medium'
              }
            >
              {req.label}
            </span>
            {req.comingSoon && (
              <span className="text-foreground-subtle ml-auto text-xs">
                {messages.comingSoon}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequirementIcon({
  met,
  comingSoon,
}: {
  met: boolean;
  comingSoon?: boolean;
}) {
  if (comingSoon) {
    return (
      <span
        aria-hidden="true"
        className="border-border text-foreground-subtle flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed text-[10px]"
      >
        •
      </span>
    );
  }

  const icon: UiIconName = met ? 'checkCircle' : 'close';

  return (
    <span
      aria-hidden="true"
      className={
        met
          ? 'bg-success/10 text-success flex size-5 shrink-0 items-center justify-center rounded-full'
          : 'bg-danger/10 text-danger flex size-5 shrink-0 items-center justify-center rounded-full'
      }
    >
      <AppIcon category="ui" name={icon} className="size-3.5" />
    </span>
  );
}

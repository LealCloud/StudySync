import { IconMap, type UiIconName } from '@/lib/iconMap';
import { cn } from '@/utilities/cn';
import type { ReactNode } from 'react';

interface SectionCardProps {
  /** Título visible de la sección. */
  title: string;
  /** Descripción opcional debajo del título. */
  description?: string;
  /** Icono opcional junto al título (mismo tipo que `Button`). */
  icon?: UiIconName;
  /** Contenido. Puede ser Server o Client Component. */
  children: ReactNode;
  /**
   * id del `<section>`. Si se pasa, el `<h2>` usa `${id}-title`.
   * Si no, se deriva un slug del `title` para `aria-labelledby`.
   */
  id?: string;
  /** Clases extra para el contenedor raíz. */
  className?: string;
  /** Acción opcional alineada a la derecha del header (botón, link, badge…). */
  action?: ReactNode;
}

/**
 * Slug estable para `aria-labelledby` cuando no hay `id` explícito.
 * Quita acentos, normaliza a minúsculas y colapsa separadores.
 */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Card de sección de User Settings.
 *
 * - Server Component por defecto (D-A/A1): sin estado propio. Los casos
 *   con estado se encapsulan en subcomponentes Client dentro de `children`.
 * - El look replica el `<section>` inline que hoy usan `ProfileAvatarSettings`
 *   y `CertificateEligibility`, para que Fase 3 los reemplace 1:1.
 */
export function SectionCard({
  title,
  description,
  icon,
  children,
  id,
  className,
  action,
}: SectionCardProps) {
  const titleId = `${(id ?? toSlug(title)) || 'section'}-title`;
  const Icon = icon ? IconMap.ui[icon] : null;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        'border-border bg-surface rounded-3xl border p-6 sm:p-8',
        className,
      )}
    >
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <span
                aria-hidden="true"
                className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
              >
                <Icon className="size-5" />
              </span>
            ) : null}
            <h2 id={titleId} className="text-foreground text-lg font-semibold">
              {title}
            </h2>
          </div>
          {description ? (
            <p className="text-foreground-muted mt-2 text-sm">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {children}
    </section>
  );
}

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaGraduationCap } from 'react-icons/fa';

export type LogoVariant = 'full' | 'compact';

export interface LogoProps {
  /** Variante visual: completa (icono + texto) o compacta (solo icono) */
  variant?: LogoVariant;
  /** Ruta a la que navega al hacer click. Por defecto '/' */
  href?: string;
  /** Tamaño del icono en píxeles */
  iconSize?: number;
  /** Si se pasa, sustituye al componente Link por un CustomLink u otro wrapper */
  asChild?: boolean;
  /** Clases extra para el contenedor raíz */
  className?: string;
  /** Oculta el tagline "Aprende. Conecta. Avanza." */
  showTagline?: boolean;
  /** Etiqueta accesible del enlace */
  ariaLabel?: string;
}

const DEFAULT_ARIA_LABEL = 'StudySync - Ir al inicio';

export default async function Logo({
  variant = 'full',
  href = '/',
  iconSize = 32,
  className = '',
  showTagline = true,
  ariaLabel = DEFAULT_ARIA_LABEL,
}: LogoProps) {
  const isCompact = variant === 'compact';

  const t = await getTranslations('logo');

  return (
    <Link
      href={href}
      className={`inline-flex w-fit items-center gap-3 ${className}`}
      aria-label={ariaLabel}
    >
      <span
        className="border-primary from-primary to-primary-hover text-primary-foreground grid h-10 w-10 place-items-center rounded-xl border bg-linear-to-br"
        aria-hidden="true"
      >
        <FaGraduationCap size={iconSize} strokeWidth={2} />
      </span>

      {!isCompact && (
        <span className="leading-none">
          <span className="text-foreground block text-base font-bold tracking-tight">
            StudySync
          </span>
          {showTagline && (
            <span className="text-foreground-muted mt-1 hidden text-[0.6rem] tracking-wide sm:block">
              {t('tagline')}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

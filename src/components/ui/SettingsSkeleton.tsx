import { cn } from '@/utilities/cn';

interface SettingsSkeletonProps {
  /** Cantidad de filas skeleton debajo del header. Default: 3. */
  rows?: number;
  /** Mostrar el bloque de header skeleton. Default: true. */
  showHeader?: boolean;
  /** Clases extra para el contenedor raíz. */
  className?: string;
}

/**
 * Placeholder de carga para las secciones de User Settings.
 *
 * - Server Component, sin estado.
 * - Decorativo: todo el árbol lleva `aria-hidden`. El consumidor debe
 *   anunciar el estado con `aria-busy` en su propio contenedor.
 * - `prefers-reduced-motion` ya está cubierto por la regla global de
 *   `globals.css` (anula `animate-pulse`).
 * - Replica el contenedor de `SectionCard` para que el swap
 *   skeleton → contenido no cambie el layout.
 */
export function SettingsSkeleton({
  rows = 3,
  showHeader = true,
  className,
}: SettingsSkeletonProps) {
  const safeRows = Math.max(0, Math.floor(rows));

  return (
    <div
      aria-hidden="true"
      className={cn(
        'border-border bg-surface rounded-3xl border p-6 sm:p-8',
        className,
      )}
    >
      {showHeader ? (
        <div className="mb-6 space-y-2.5">
          <div className="bg-surface-hover h-5 w-40 animate-pulse rounded-xl" />
          <div className="bg-surface-hover h-4 w-64 animate-pulse rounded-xl" />
        </div>
      ) : null}

      <div className="space-y-3">
        {Array.from({ length: safeRows }, (_, index) => (
          <div
            key={index}
            className="bg-surface-hover h-11 w-full animate-pulse rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

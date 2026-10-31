'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/utilities/cn';
import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  /** Controla la apertura. El padre decide cuándo mostrar el dialog. */
  open: boolean;
  /** Se llama cuando el usuario cierra (Cancelar, Escape, backdrop, X). */
  onClose: () => void;
  /** Acción al confirmar. Puede ser async; el padre maneja `isPending`. */
  onConfirm: () => void | Promise<void>;
  /** Título visible y fuente del `aria-labelledby`. */
  title: string;
  /** Descripción opcional debajo del título. */
  description?: string;
  /** Texto del botón de confirmar. */
  confirmLabel: string;
  /** Texto del botón de cancelar. */
  cancelLabel: string;
  /** Si true, el botón de confirmar usa look de peligro (bg-danger). */
  destructive?: boolean;
  /** Deshabilita ambos botones mientras la mutación está en vuelo. */
  isPending?: boolean;
  /** Clases extra para el `<dialog>`. */
  className?: string;
}

/**
 * Slug estable para `aria-labelledby` derivado del título.
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
 * Diálogo de confirmación para acciones destructivas o inversas de
 * destructivas (D-C/C2).
 *
 * - Usa `<dialog>` nativo: focus trap, Escape, restauración de foco y
 *   `aria-modal` los provee el navegador.
 * - Server → Client boundary: es `'use client'` porque maneja
 *   `showModal()` / `close()` con refs y efectos.
 * - Animación: solo de entrada (fade del backdrop + fade/scale del panel).
 *   La salida es inmediata (`dialog.close()`). `prefers-reduced-motion`
 *   anula la animación vía la regla global de `globals.css`.
 * - `onClose` centraliza Cancelar, Escape y click en backdrop. El padre
 *   mantiene un único camino de cierre.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  isPending = false,
  className,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const descriptionId = useId();
  const titleId = `${toSlug(title) || 'confirm-dialog'}-title`;

  // Sincroniza el estado `open` del padre con el `<dialog>` nativo.
  // `showModal()` bloquea el resto del documento y atrapa el foco.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Escape: el navegador dispara `cancel`. Lo interceptamos para pasar
  // por `onClose()` en lugar de cerrar por default (evita doble estado).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // El navegador cierra el `<dialog>` por default en algunos casos
  // (p. ej. llamada directa a `close()`). Sincronizamos con el padre.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (open) onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [open, onClose]);

  // Click en el backdrop: el `<dialog>` recibe el click en toda su área;
  // el panel interior detiene la propagación. Si el target es el propio
  // `<dialog>`, el usuario clickeó fuera del panel.
  const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleDialogClick}
      className={cn(
        'bg-foreground/40 backdrop:bg-foreground/40 fixed inset-0 m-0 h-full max-h-none w-full max-w-none p-4 backdrop:backdrop-blur-sm',
        'open:grid open:place-items-center',
        className,
      )}
    >
      <div
        role="document"
        className="border-border bg-surface w-full max-w-md rounded-3xl border p-6 shadow-xl sm:p-7"
      >
        <h2
          id={titleId}
          className="text-foreground text-lg font-semibold tracking-[-0.01em]"
        >
          {title}
        </h2>
        {description ? (
          <p
            id={descriptionId}
            className="text-foreground-muted mt-2 text-sm leading-relaxed"
          >
            {description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void onConfirm()}
            disabled={isPending}
            className={
              destructive
                ? 'bg-danger hover:bg-danger-hover focus-visible:ring-danger'
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

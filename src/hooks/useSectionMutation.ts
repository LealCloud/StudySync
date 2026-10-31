'use client';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { useCallback, useState } from 'react';
import { useMutation, type AnyVariables } from 'urql';

/* ============================================================
   useSectionMutation
   ============================================================

   Wrapper de `useMutation` de URQL para las secciones de
   User Settings (D-B/B1).

   Contrato del hook:
   - NO hace optimismo de caché. La normalización la resuelve el
     `cacheExchange` del `UrqlProvider` cuando la mutación devuelve
     entidades con `id` (D7). Las mutaciones que no devuelven
     entidad se resuelven con `updates` explícito (fuera de alcance).
   - Extrae `error.code` de `graphQLErrors[0].extensions.code` una
     sola vez. El consumidor no conoce el detalle de transporte.
   - `mapError` recibe el `code` crudo del BFF y devuelve el código
     de dominio de la UI (o `null` para descartar). Si no se pasa,
     el hook expone el `code` crudo.
   - `onSuccess` se llama solo cuando la mutación termina con `data`
     y sin `error`.
   ============================================================ */

/** Código que el hook usa cuando no hay `graphQLErrors` (red, parse…). */
const FALLBACK_ERROR_CODE = 'INTERNAL_ERROR';

interface UseSectionMutationOptions<TData, TVariables, TParsed> {
  /** Documento tipado de graphql-codegen (`TypedDocumentNode`). */
  document: TypedDocumentNode<TData, TVariables>;
  /** Construye las variables de URQL desde el input de dominio. */
  parseVariables: (input: TParsed) => TVariables;
  /**
   * Mapea el `error.code` del BFF a un código de dominio de la UI.
   * Recibe `'INTERNAL_ERROR'` cuando no hay `graphQLErrors`.
   * Devuelve `null` para que el consumidor decida no exponer código.
   */
  mapError?: (code: string) => string | null;
  /** Se llama al recibir `data` exitosa. Puede ser async. */
  onSuccess?: (data: TData) => void | Promise<void>;
}

interface MutateResult {
  /** `true` si la mutación terminó con `data` y sin `error`. */
  ok: boolean;
  /** Código de error mapeado (o crudo). `null` si `ok: true`. */
  errorCode: string | null;
}

interface UseSectionMutationResult<TParsed> {
  /** Ejecuta la mutación con el input de dominio. */
  mutate: (input: TParsed) => Promise<MutateResult>;
  /** `true` mientras la mutación está en vuelo (`result.fetching`). */
  isSaving: boolean;
  /** Último `errorCode` mapeado. `null` si no hay error. */
  errorCode: string | null;
  /** Limpia `errorCode` para reintentar. No aborta la mutación en vuelo. */
  resetError: () => void;
}

export function useSectionMutation<
  TData,
  TVariables extends AnyVariables,
  TParsed,
>({
  document,
  parseVariables,
  mapError,
  onSuccess,
}: UseSectionMutationOptions<
  TData,
  TVariables,
  TParsed
>): UseSectionMutationResult<TParsed> {
  const [result, execute] = useMutation<TData, TVariables>(document);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TParsed): Promise<MutateResult> => {
      setErrorCode(null);

      const variables = parseVariables(input);
      const mutationResult = await execute(variables);

      if (mutationResult.error || !mutationResult.data) {
        const rawCode =
          (mutationResult.error?.graphQLErrors[0]?.extensions?.code as
            string | undefined) ?? FALLBACK_ERROR_CODE;
        const mapped = mapError ? mapError(rawCode) : rawCode;
        setErrorCode(mapped);
        return { ok: false, errorCode: mapped };
      }

      await onSuccess?.(mutationResult.data);
      return { ok: true, errorCode: null };
    },
    [execute, parseVariables, mapError, onSuccess],
  );

  const resetError = useCallback(() => {
    setErrorCode(null);
  }, []);

  return {
    mutate,
    isSaving: result.fetching,
    errorCode,
    resetError,
  };
}

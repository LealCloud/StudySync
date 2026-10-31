'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  RemovePaymentMethodDocument,
  type MyPaymentMethodsQuery,
  type RemovePaymentMethodMutation,
  type RemovePaymentMethodMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { useCallback, useState } from 'react';

type PaymentMethodRecord = MyPaymentMethodsQuery['myPaymentMethods'][number];

export interface PaymentMethodsMessages {
  title: string;
  description: string;
  empty: string;
  fields: {
    brand: string;
    last4: string;
    expiration: string;
    unknownBrand: string;
    unknownLast4: string;
  };
  actions: {
    remove: string;
    removing: string;
  };
  confirmRemove: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
  successRemove: string;
  errors: {
    NOT_FOUND: string;
    CONFLICT: string;
    FORBIDDEN: string;
    INTERNAL_ERROR: string;
  };
}

interface PaymentMethodsClientProps {
  messages: PaymentMethodsMessages;
  paymentMethods: PaymentMethodRecord[];
}

export function PaymentMethodsClient({
  messages,
  paymentMethods,
}: PaymentMethodsClientProps) {
  const [pendingRemoval, setPendingRemoval] =
    useState<PaymentMethodRecord | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mapError = useCallback(
    (code: string): string | null => {
      switch (code) {
        case 'NOT_FOUND':
          return messages.errors.NOT_FOUND;
        case 'CONFLICT':
          return messages.errors.CONFLICT;
        case 'FORBIDDEN':
          return messages.errors.FORBIDDEN;
        case 'INTERNAL_ERROR':
          return messages.errors.INTERNAL_ERROR;
        default:
          return null;
      }
    },
    [messages.errors],
  );

  const {
    mutate: removePaymentMethod,
    isSaving: isRemoving,
    errorCode,
  } = useSectionMutation<
    RemovePaymentMethodMutation,
    RemovePaymentMethodMutationVariables,
    string
  >({
    document: RemovePaymentMethodDocument,
    parseVariables: (paymentMethodId) => ({ paymentMethodId }),
    mapError,
    onSuccess: () => {
      setPendingRemoval(null);
      setSuccess(messages.successRemove);
    },
  });

  const handleConfirm = async () => {
    if (!pendingRemoval) return;
    setSuccess(null);
    await removePaymentMethod(pendingRemoval.id);
  };

  const handleCloseDialog = () => {
    if (isRemoving) return;
    setPendingRemoval(null);
  };

  return (
    <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="text-foreground text-sm font-semibold">
          {messages.title}
        </h3>
        <p className="text-foreground-muted mt-1 text-xs">
          {messages.description}
        </p>
      </header>

      {errorCode && (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger mb-4 rounded-xl border px-3 py-2 text-sm"
        >
          {errorCode}
        </p>
      )}

      {success && (
        <p role="status" className="text-success mb-4 text-sm">
          {success}
        </p>
      )}

      {paymentMethods.length === 0 ? (
        <p role="status" className="text-foreground-muted text-sm">
          {messages.empty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {paymentMethods.map((method) => (
            <li
              key={method.id}
              className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {method.brand ?? messages.fields.unknownBrand}
                  {method.last4 ? ` · ${method.last4}` : ''}
                </p>
                {method.expirationMonth !== null &&
                  method.expirationYear !== null && (
                    <p className="text-foreground-muted mt-0.5 text-xs">
                      {messages.fields.expiration.replace(
                        '{date}',
                        `${String(method.expirationMonth).padStart(2, '0')}/${method.expirationYear}`,
                      )}
                    </p>
                  )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSuccess(null);
                  setPendingRemoval(method);
                }}
                disabled={isRemoving}
                className="hover:bg-danger/10 hover:text-danger"
              >
                {messages.actions.remove}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingRemoval !== null}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
        title={messages.confirmRemove.title}
        description={messages.confirmRemove.description.replace(
          '{card}',
          pendingRemoval
            ? `${pendingRemoval.brand ?? messages.fields.unknownBrand}${pendingRemoval.last4 ? ` · ${pendingRemoval.last4}` : ''}`
            : '',
        )}
        confirmLabel={
          isRemoving
            ? messages.actions.removing
            : messages.confirmRemove.confirm
        }
        cancelLabel={messages.confirmRemove.cancel}
        destructive
        isPending={isRemoving}
      />
    </section>
  );
}

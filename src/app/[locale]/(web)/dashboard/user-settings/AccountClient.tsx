'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  CancelAccountDeactivationDocument,
  MyAccountDocument,
  RequestAccountDeactivationDocument,
  type CancelAccountDeactivationMutation,
  type CancelAccountDeactivationMutationVariables,
  type MyAccountQuery,
  type RequestAccountDeactivationMutation,
  type RequestAccountDeactivationMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { useLocale } from 'next-intl';
import { useCallback, useState } from 'react';
import { useQuery } from 'urql';

type AccountRecord = MyAccountQuery['myAccount'];

interface AccountMessages {
  statuses: {
    active: { title: string; description: string };
    pending_deactivation: { title: string; description: string };
    suspended: { title: string; description: string };
    inactive: { title: string; description: string };
  };
  actions: {
    request: string;
    requesting: string;
    cancel: string;
    cancelling: string;
  };
  confirmRequest: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
  confirmCancel: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
  successRequest: string;
  successCancel: string;
  errors: {
    VALIDATION_ERROR: string;
    FORBIDDEN: string;
    CONFLICT: string;
    INTERNAL_ERROR: string;
  };
}

interface AccountClientProps {
  messages: AccountMessages;
}

type DialogState = 'request' | 'cancel' | null;

function formatDate(value: unknown, locale: string): string {
  if (typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

export function AccountClient({ messages }: AccountClientProps) {
  const locale = useLocale();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [queryResult] = useQuery({
    query: MyAccountDocument,
    requestPolicy: 'cache-and-network',
  });

  const account: AccountRecord | undefined = queryResult.data?.myAccount;
  const status = account?.status;

  const mapError = useCallback(
    (code: string): string | null => {
      switch (code) {
        case 'VALIDATION_ERROR':
          return messages.errors.VALIDATION_ERROR;
        case 'FORBIDDEN':
          return messages.errors.FORBIDDEN;
        case 'CONFLICT':
          return messages.errors.CONFLICT;
        case 'INTERNAL_ERROR':
          return messages.errors.INTERNAL_ERROR;
        default:
          return null;
      }
    },
    [messages.errors],
  );

  const {
    mutate: requestDeactivation,
    isSaving: isRequesting,
    errorCode: requestErrorCode,
  } = useSectionMutation<
    RequestAccountDeactivationMutation,
    RequestAccountDeactivationMutationVariables,
    void
  >({
    document: RequestAccountDeactivationDocument,
    parseVariables: () => ({}),
    mapError,
    onSuccess: () => {
      setDialog(null);
      setSuccess(messages.successRequest);
    },
  });

  const {
    mutate: cancelDeactivation,
    isSaving: isCancelling,
    errorCode: cancelErrorCode,
  } = useSectionMutation<
    CancelAccountDeactivationMutation,
    CancelAccountDeactivationMutationVariables,
    void
  >({
    document: CancelAccountDeactivationDocument,
    parseVariables: () => ({}),
    mapError,
    onSuccess: () => {
      setDialog(null);
      setSuccess(messages.successCancel);
    },
  });

  const handleConfirm = async () => {
    setSuccess(null);
    if (dialog === 'request') {
      await requestDeactivation();
    } else if (dialog === 'cancel') {
      await cancelDeactivation();
    }
  };

  const handleCloseDialog = () => {
    if (isRequesting || isCancelling) return;
    setDialog(null);
  };

  const isMutating = isRequesting || isCancelling;
  const activeErrorCode =
    dialog === 'request'
      ? requestErrorCode
      : dialog === 'cancel'
        ? cancelErrorCode
        : null;

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={3} />;
  }

  if (!queryResult.data && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!account) return null;

  return (
    <div className="grid gap-4">
      {queryResult.error && (
        <p role="alert" className="text-danger">
          {messages.errors.INTERNAL_ERROR}
        </p>
      )}

      {activeErrorCode && (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border px-3 py-2 text-sm"
        >
          {activeErrorCode}
        </p>
      )}

      {success && (
        <p role="status" className="text-success text-sm">
          {success}
        </p>
      )}

      {status === 'active' && (
        <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
          <h3 className="text-foreground text-sm font-semibold">
            {messages.statuses.active.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.statuses.active.description}
          </p>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setSuccess(null);
                setDialog('request');
              }}
              disabled={isMutating}
              className="bg-danger hover:bg-danger-hover focus-visible:ring-danger"
            >
              {messages.actions.request}
            </Button>
          </div>
        </section>
      )}

      {status === 'pending_deactivation' && (
        <section className="border-warning/30 bg-warning/10 rounded-2xl border p-4 sm:p-5">
          <h3 className="text-foreground text-sm font-semibold">
            {messages.statuses.pending_deactivation.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.statuses.pending_deactivation.description.replace(
              '{date}',
              formatDate(account.deactivationScheduledAt, locale),
            )}
          </p>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSuccess(null);
                setDialog('cancel');
              }}
              disabled={isMutating}
            >
              {messages.actions.cancel}
            </Button>
          </div>
        </section>
      )}

      {status === 'suspended' && (
        <section className="border-danger/30 bg-danger/10 rounded-2xl border p-4 sm:p-5">
          <h3 className="text-foreground text-sm font-semibold">
            {messages.statuses.suspended.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.statuses.suspended.description}
          </p>
        </section>
      )}

      {status === 'inactive' && (
        <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
          <h3 className="text-foreground text-sm font-semibold">
            {messages.statuses.inactive.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.statuses.inactive.description}
          </p>
        </section>
      )}

      <ConfirmDialog
        open={dialog === 'request'}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
        title={messages.confirmRequest.title}
        description={messages.confirmRequest.description}
        confirmLabel={
          isRequesting
            ? messages.actions.requesting
            : messages.confirmRequest.confirm
        }
        cancelLabel={messages.confirmRequest.cancel}
        destructive
        isPending={isMutating}
      />

      <ConfirmDialog
        open={dialog === 'cancel'}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
        title={messages.confirmCancel.title}
        description={messages.confirmCancel.description}
        confirmLabel={
          isCancelling
            ? messages.actions.cancelling
            : messages.confirmCancel.confirm
        }
        cancelLabel={messages.confirmCancel.cancel}
        isPending={isMutating}
      />
    </div>
  );
}

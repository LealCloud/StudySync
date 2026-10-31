'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  RevokeOtherSessionsDocument,
  RevokeSessionDocument,
  type MySecuritySettingsQuery,
  type RevokeOtherSessionsMutation,
  type RevokeOtherSessionsMutationVariables,
  type RevokeSessionMutation,
  type RevokeSessionMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

type SecuritySession =
  MySecuritySettingsQuery['mySecuritySettings']['sessions'][number];

interface SessionsMessages {
  title: string;
  description: string;
  currentBadge: string;
  unknownDevice: string;
  unknownBrowser: string;
  unknownIp: string;
  lastActive: string;
  revoke: string;
  revokeAllOthers: string;
  empty: string;
  confirmRevokeTitle: string;
  confirmRevokeDescription: string;
  confirmRevokeOthersTitle: string;
  confirmRevokeOthersDescription: string;
  confirm: string;
  confirmOthers: string;
  cancel: string;
  revoking: string;
  successRevoked: string;
  successRevokedOthers: string;
  errors: {
    NOT_FOUND: string;
    SESSION_IS_CURRENT: string;
    INTERNAL_ERROR: string;
  };
}

interface SessionsSectionProps {
  messages: SessionsMessages;
  sessions: SecuritySession[];
  onRefetchSecurity: () => void;
}

type DialogState =
  | { type: 'one'; sessionId: string; deviceName: string | null }
  | { type: 'others' }
  | null;

/**
 * Formatea un valor `DateTime` (tipado como `unknown` por codegen)
 * usando `Intl.DateTimeFormat`. Devuelve la cadena cruda como fallback
 * si el valor no es una fecha válida.
 */
function formatDate(value: unknown, locale: string): string {
  if (typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function SessionsSection({
  messages,
  sessions,
  onRefetchSecurity,
}: SessionsSectionProps) {
  const locale = useLocale();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const otherSessions = useMemo(
    () => sessions.filter((s) => !s.current),
    [sessions],
  );
  const hasOtherSessions = otherSessions.length > 0;

  const mapError = (code: string): string | null => {
    switch (code) {
      case 'NOT_FOUND':
        return messages.errors.NOT_FOUND;
      case 'SESSION_IS_CURRENT':
        return messages.errors.SESSION_IS_CURRENT;
      case 'INTERNAL_ERROR':
        return messages.errors.INTERNAL_ERROR;
      default:
        return null;
    }
  };

  /* ------------------------------------------------------------
   * revokeSession(sessionId)
   * ------------------------------------------------------------ */
  const { mutate: revokeOne, isSaving: isRevokingOne } = useSectionMutation<
    RevokeSessionMutation,
    RevokeSessionMutationVariables,
    string
  >({
    document: RevokeSessionDocument,
    parseVariables: (sessionId) => ({ sessionId }),
    mapError,
    onSuccess: () => {
      setDialog(null);
      setSuccess(messages.successRevoked);
      onRefetchSecurity();
    },
  });

  /* ------------------------------------------------------------
   * revokeOtherSessions()
   * ------------------------------------------------------------ */
  const { mutate: revokeOthers, isSaving: isRevokingOthers } =
    useSectionMutation<
      RevokeOtherSessionsMutation,
      RevokeOtherSessionsMutationVariables,
      void
    >({
      document: RevokeOtherSessionsDocument,
      parseVariables: () => ({}),
      mapError,
      onSuccess: () => {
        setDialog(null);
        setSuccess(messages.successRevokedOthers);
        onRefetchSecurity();
      },
    });

  const handleConfirm = async () => {
    if (!dialog) return;

    setSuccess(null);
    setErrorCode(null);

    const result =
      dialog.type === 'one'
        ? await revokeOne(dialog.sessionId)
        : await revokeOthers();

    if (!result.ok) setErrorCode(result.errorCode);
  };

  const handleCloseDialog = () => {
    if (isRevokingOne || isRevokingOthers) return;
    setDialog(null);
  };

  const isPending = isRevokingOne || isRevokingOthers;

  return (
    <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            {messages.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.description}
          </p>
        </div>
        {hasOtherSessions && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSuccess(null);
              setErrorCode(null);
              setDialog({ type: 'others' });
            }}
            disabled={isPending}
            className="hover:bg-danger/10 hover:text-danger"
          >
            {messages.revokeAllOthers}
          </Button>
        )}
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

      <ul className="grid gap-2">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="border-border bg-surface flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3"
          >
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium">
                {session.deviceName ?? messages.unknownDevice}
                {session.current && (
                  <span className="border-success/20 bg-success/10 text-success ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold">
                    {messages.currentBadge}
                  </span>
                )}
              </p>
              <p className="text-foreground-muted mt-0.5 text-xs">
                {session.browser ?? messages.unknownBrowser}
                {' · '}
                {session.ipAddress ?? messages.unknownIp}
              </p>
              <p className="text-foreground-subtle mt-0.5 text-xs">
                {messages.lastActive.replace(
                  '{date}',
                  formatDate(session.lastActiveAt, locale),
                )}
              </p>
            </div>
            {!session.current && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSuccess(null);
                  setErrorCode(null);
                  setDialog({
                    type: 'one',
                    sessionId: session.id,
                    deviceName: session.deviceName,
                  });
                }}
                disabled={isPending}
                className="hover:bg-danger/10 hover:text-danger"
              >
                {messages.revoke}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {!hasOtherSessions && (
        <p className="text-foreground-muted mt-3 text-xs">{messages.empty}</p>
      )}

      <ConfirmDialog
        open={dialog !== null}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
        title={
          dialog?.type === 'one'
            ? messages.confirmRevokeTitle
            : messages.confirmRevokeOthersTitle
        }
        description={
          dialog?.type === 'one'
            ? messages.confirmRevokeDescription.replace(
                '{device}',
                dialog.deviceName ?? messages.unknownDevice,
              )
            : dialog?.type === 'others'
              ? messages.confirmRevokeOthersDescription
              : undefined
        }
        confirmLabel={
          dialog?.type === 'one' ? messages.confirm : messages.confirmOthers
        }
        cancelLabel={messages.cancel}
        destructive
        isPending={isPending}
      />
    </section>
  );
}

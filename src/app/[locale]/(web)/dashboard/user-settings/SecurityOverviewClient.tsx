'use client';

import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  MySecuritySettingsDocument,
  type MySecuritySettingsQuery,
} from '@/graphql/generated/graphql';
import { useCallback } from 'react';
import { useQuery } from 'urql';
import { ChangePasswordSection } from './ChangePasswordSection';
import type { ValidationDict } from '@/lib/validation';
import { EmailChangeSection } from './EmailChangeSection';
import { TwoFactorSection } from './TwoFactorSection';
import { SessionsSection } from './SessionsSection';

type SecuritySettings = MySecuritySettingsQuery['mySecuritySettings'];

interface SecurityOverviewMessages {
  overview: {
    email: string;
    emailVerified: string;
    emailNotVerified: string;
    twoFactor: string;
    twoFactorEnabled: string;
    twoFactorDisabled: string;
    twoFactorRequired: string;
    sessions: string;
    sessionsCount: string;
  };
  errors: {
    INTERNAL_ERROR: string;
    sameAsCurrent: string;
  };
  changePassword: {
    title: string;
    description: string;
    fields: {
      currentPassword: {
        label: string;
        placeholder: string;
        show: string;
        hide: string;
      };
      newPassword: {
        label: string;
        placeholder: string;
        show: string;
        hide: string;
      };
      confirmPassword: { label: string; placeholder: string };
    };
    actions: { save: string; saving: string };
    successMessage: string;
    errors: {
      VALIDATION_ERROR: string;
      INVALID_CURRENT_PASSWORD: string;
      CONFLICT: string;
      INTERNAL_ERROR: string;
    };
  };
  emailChange: {
    title: string;
    description: string;
    fields: {
      newEmail: { label: string; placeholder: string };
    };
    actions: { save: string; saving: string };
    successMessage: string;
    errors: {
      VALIDATION_ERROR: string;
      EMAIL_TAKEN: string;
      EMAIL_UNCHANGED: string;
      INTERNAL_ERROR: string;
    };
  };
  twoFactor: {
    title: string;
    description: string;
    enabled: string;
    disabled: string;
    required: string;
    activate: string;
    activating: string;
    verifyingTitle: string;
    verifyingDescription: string;
    codeLabel: string;
    codePlaceholder: string;
    verify: string;
    verifying: string;
    cancel: string;
    disable: string;
    disabling: string;
    disablingTitle: string;
    disablingDescription: string;
    successEnabled: string;
    successDisabled: string;
    errors: {
      VALIDATION_ERROR: string;
      INVALID_CODE: string;
      CONFLICT: string;
      FORBIDDEN: string;
      INTERNAL_ERROR: string;
    };
  };
  sessions: {
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
  };
}

interface SecurityOverviewClientProps {
  messages: SecurityOverviewMessages;
  validation: ValidationDict;
}

/**
 * Contenedor de la sección Security.
 *
 * Centraliza:
 *   - El `useQuery(mySecuritySettings)` (fuente de verdad del estado).
 *   - El `refetchSecurity` expuesto a los subformularios. Las mutaciones de
 *     Security no devuelven entidades normalizables, así que en esta fase
 *     cada mutación exitosa dispara un refetch `network-only` (ver prompt
 *     de rol v4.2 y plan §5.3.9).
 *
 * En este paso todavía no renderiza los subformularios (ChangePassword,
 * EmailChange, TwoFactor, Sessions); se añaden en 4.2–4.5.
 */
export function SecurityOverviewClient({
  messages,
  validation,
}: SecurityOverviewClientProps) {
  const [result, reexecuteQuery] = useQuery({
    query: MySecuritySettingsDocument,
    requestPolicy: 'cache-and-network',
  });

  const refetchSecurity = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  if (result.fetching && !result.data) {
    return <SettingsSkeleton rows={4} />;
  }

  if (!result.data && result.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!result.data) return null;

  const security: SecuritySettings = result.data.mySecuritySettings;
  const sessionCount = security.sessions.length;

  // TODO(4.2–4.5): los subformularios reciben `security` y `refetchSecurity`.
  // Mientras tanto, mostramos solo el resumen de solo lectura.
  void refetchSecurity;

  return (
    <div className="grid gap-6">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-background rounded-xl border p-4">
          <dt className="text-foreground-muted text-xs font-semibold">
            {messages.overview.email}
          </dt>
          <dd className="text-foreground mt-1 text-sm break-all">
            {security.email}
          </dd>
          <dd
            className={
              security.emailVerified
                ? 'text-success mt-1 text-xs font-medium'
                : 'text-warning mt-1 text-xs font-medium'
            }
          >
            {security.emailVerified
              ? messages.overview.emailVerified
              : messages.overview.emailNotVerified}
          </dd>
        </div>

        <div className="border-border bg-background rounded-xl border p-4">
          <dt className="text-foreground-muted text-xs font-semibold">
            {messages.overview.twoFactor}
          </dt>
          <dd
            className={
              security.twoFactorEnabled
                ? 'text-success mt-1 text-sm font-medium'
                : 'text-foreground-muted mt-1 text-sm font-medium'
            }
          >
            {security.twoFactorEnabled
              ? messages.overview.twoFactorEnabled
              : messages.overview.twoFactorDisabled}
          </dd>
          {security.twoFactorRequired && (
            <dd className="text-warning mt-1 text-xs font-medium">
              {messages.overview.twoFactorRequired}
            </dd>
          )}
        </div>

        <div className="border-border bg-background rounded-xl border p-4 sm:col-span-2">
          <dt className="text-foreground-muted text-xs font-semibold">
            {messages.overview.sessions}
          </dt>
          <dd className="text-foreground mt-1 text-sm">
            {messages.overview.sessionsCount.replace(
              '{count}',
              String(sessionCount),
            )}
          </dd>
        </div>
      </dl>

      <ChangePasswordSection
        messages={messages.changePassword}
        validation={validation}
        onRefetchSecurity={refetchSecurity}
      />

      <EmailChangeSection
        messages={messages.emailChange}
        validation={validation}
        currentEmail={security.email}
      />

      <TwoFactorSection
        messages={messages.twoFactor}
        validation={validation}
        twoFactorEnabled={security.twoFactorEnabled}
        twoFactorRequired={security.twoFactorRequired}
        onRefetchSecurity={refetchSecurity}
      />

      <SessionsSection
        messages={messages.sessions}
        sessions={security.sessions}
        onRefetchSecurity={refetchSecurity}
      />
    </div>
  );
}

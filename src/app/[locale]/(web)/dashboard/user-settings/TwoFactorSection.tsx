'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import {
  BeginTwoFactorSetupDocument,
  DisableTwoFactorDocument,
  VerifyTwoFactorSetupDocument,
  type BeginTwoFactorSetupMutation,
  type BeginTwoFactorSetupMutationVariables,
  type DisableTwoFactorMutation,
  type DisableTwoFactorMutationVariables,
  type VerifyTwoFactorSetupMutation,
  type VerifyTwoFactorSetupMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import {
  twoFactorCodeSchema,
  type TwoFactorCodeInput,
} from '@/lib/schemas/user-settings/security.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';

type Phase = 'idle' | 'verifying' | 'disabling';

interface TwoFactorMessages {
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
}

interface TwoFactorSectionProps {
  messages: TwoFactorMessages;
  validation: ValidationDict;
  /** `mySecuritySettings.twoFactorEnabled` (fuente de verdad). */
  twoFactorEnabled: boolean;
  /** `mySecuritySettings.twoFactorRequired` (rol). Si true, no se puede desactivar. */
  twoFactorRequired: boolean;
  /** Refetch de mySecuritySettings (network-only) tras verify/disable. */
  onRefetchSecurity: () => void;
}

const DEFAULT_VALUES: TwoFactorCodeInput = { code: '' };

export function TwoFactorSection({
  messages,
  validation,
  twoFactorEnabled,
  twoFactorRequired,
  onRefetchSecurity,
}: TwoFactorSectionProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [success, setSuccess] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const form = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(twoFactorCodeSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const resetForm = () => {
    form.reset(DEFAULT_VALUES);
    setSuccess(null);
    setErrorCode(null);
  };

  /* ------------------------------------------------------------
   * BEGIN: activa el flujo de setup. No renderizamos secret ni qrCode
   * (contrato §9 regla 6). El backend envía el código al correo.
   * ------------------------------------------------------------ */
  const { mutate: beginMutate, isSaving: isBeginning } = useSectionMutation<
    BeginTwoFactorSetupMutation,
    BeginTwoFactorSetupMutationVariables,
    void
  >({
    document: BeginTwoFactorSetupDocument,
    parseVariables: () => ({}),
    mapError: (code) => {
      switch (code) {
        case 'CONFLICT':
          return messages.errors.CONFLICT;
        case 'INTERNAL_ERROR':
          return messages.errors.INTERNAL_ERROR;
        default:
          return null;
      }
    },
    onSuccess: () => {
      // Ignoramos `secret` y `qrCode`: no se renderizan ni se guardan
      // en estado. La UI actual usa 2FA por correo, no TOTP.
      resetForm();
      setPhase('verifying');
    },
  });

  /* ------------------------------------------------------------
   * VERIFY: confirma el setup con el código recibido por correo.
   * ------------------------------------------------------------ */
  const { mutate: verifyMutate, isSaving: isVerifying } = useSectionMutation<
    VerifyTwoFactorSetupMutation,
    VerifyTwoFactorSetupMutationVariables,
    TwoFactorCodeInput
  >({
    document: VerifyTwoFactorSetupDocument,
    parseVariables: (input) => ({ code: input.code }),
    mapError: (code) => {
      switch (code) {
        case 'VALIDATION_ERROR':
          return messages.errors.VALIDATION_ERROR;
        case 'INVALID_CODE':
          return messages.errors.INVALID_CODE;
        case 'CONFLICT':
          return messages.errors.CONFLICT;
        case 'INTERNAL_ERROR':
          return messages.errors.INTERNAL_ERROR;
        default:
          return null;
      }
    },
    onSuccess: () => {
      resetForm();
      setPhase('idle');
      setSuccess(messages.successEnabled);
      onRefetchSecurity();
    },
  });

  /* ------------------------------------------------------------
   * DISABLE: solo disponible si twoFactorEnabled && !twoFactorRequired.
   * El BFF bloquea con 403 si el rol no es student, pero la UI
   * además oculta la acción (decisión A).
   * ------------------------------------------------------------ */
  const { mutate: disableMutate, isSaving: isDisabling } = useSectionMutation<
    DisableTwoFactorMutation,
    DisableTwoFactorMutationVariables,
    TwoFactorCodeInput
  >({
    document: DisableTwoFactorDocument,
    parseVariables: (input) => ({ code: input.code }),
    mapError: (code) => {
      switch (code) {
        case 'VALIDATION_ERROR':
          return messages.errors.VALIDATION_ERROR;
        case 'INVALID_CODE':
          return messages.errors.INVALID_CODE;
        case 'FORBIDDEN':
          return messages.errors.FORBIDDEN;
        case 'INTERNAL_ERROR':
          return messages.errors.INTERNAL_ERROR;
        default:
          return null;
      }
    },
    onSuccess: () => {
      resetForm();
      setPhase('idle');
      setSuccess(messages.successDisabled);
      onRefetchSecurity();
    },
  });

  /* ------------------------------------------------------------
   * Handlers
   * ------------------------------------------------------------ */
  const handleBegin = async () => {
    setSuccess(null);
    setErrorCode(null);
    const result = await beginMutate();
    if (!result.ok) setErrorCode(result.errorCode);
  };

  const handleVerify: SubmitHandler<TwoFactorCodeInput> = async (values) => {
    setSuccess(null);
    setErrorCode(null);
    const result = await verifyMutate(values);
    if (!result.ok) setErrorCode(result.errorCode);
  };

  const handleDisable: SubmitHandler<TwoFactorCodeInput> = async (values) => {
    setSuccess(null);
    setErrorCode(null);
    const result = await disableMutate(values);
    if (!result.ok) setErrorCode(result.errorCode);
  };

  const handleCancel = () => {
    resetForm();
    setPhase('idle');
  };

  const fieldError = (key?: string) => resolveError(validation, key);

  /* ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------ */
  const showEnabledBadge = twoFactorEnabled;
  const showDisableAction = twoFactorEnabled && !twoFactorRequired;
  const showRequiredBadge = twoFactorEnabled && twoFactorRequired;

  return (
    <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            {messages.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.description}
          </p>
        </div>
        <span
          className={
            showEnabledBadge
              ? 'border-success/20 bg-success/10 text-success inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold'
              : 'border-border bg-surface text-foreground-muted inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold'
          }
        >
          {showEnabledBadge ? messages.enabled : messages.disabled}
        </span>
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

      {/* ---------- Fase "verifying": input de código ---------- */}
      {phase === 'verifying' && (
        <div className="grid gap-3">
          <div className="border-border bg-surface rounded-xl border p-3">
            <p className="text-foreground text-sm font-semibold">
              {messages.verifyingTitle}
            </p>
            <p className="text-foreground-muted mt-1 text-xs">
              {messages.verifyingDescription}
            </p>
          </div>

          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit(handleVerify)}
            noValidate
            aria-busy={isVerifying}
          >
            <Controller
              name="code"
              control={form.control}
              render={({ field }) => (
                <InputField
                  name="code"
                  label={messages.codeLabel}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={messages.codePlaceholder}
                  autoComplete="one-time-code"
                  error={fieldError(form.formState.errors.code?.message)}
                  disabled={isVerifying}
                />
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isVerifying}
              >
                {messages.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!form.formState.isValid || isVerifying}
              >
                {isVerifying ? messages.verifying : messages.verify}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Fase "disabling": input de código ---------- */}
      {phase === 'disabling' && (
        <div className="grid gap-3">
          <div className="border-warning/30 bg-warning/10 rounded-xl border p-3">
            <p className="text-foreground text-sm font-semibold">
              {messages.disablingTitle}
            </p>
            <p className="text-foreground-muted mt-1 text-xs">
              {messages.disablingDescription}
            </p>
          </div>

          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit(handleDisable)}
            noValidate
            aria-busy={isDisabling}
          >
            <Controller
              name="code"
              control={form.control}
              render={({ field }) => (
                <InputField
                  name="code"
                  label={messages.codeLabel}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={messages.codePlaceholder}
                  autoComplete="one-time-code"
                  error={fieldError(form.formState.errors.code?.message)}
                  disabled={isDisabling}
                />
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isDisabling}
              >
                {messages.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!form.formState.isValid || isDisabling}
                className="bg-danger hover:bg-danger-hover focus-visible:ring-danger"
              >
                {isDisabling ? messages.disabling : messages.disable}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Fase "idle": acciones principales ---------- */}
      {phase === 'idle' && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showRequiredBadge && (
            <span className="text-warning text-xs font-medium">
              {messages.required}
            </span>
          )}
          {!twoFactorEnabled && (
            <Button
              type="button"
              variant="primary"
              onClick={handleBegin}
              disabled={isBeginning}
            >
              {isBeginning ? messages.activating : messages.activate}
            </Button>
          )}
          {showDisableAction && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setPhase('disabling');
              }}
            >
              {messages.disable}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

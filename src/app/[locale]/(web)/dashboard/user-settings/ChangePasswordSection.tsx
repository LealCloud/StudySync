'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import {
  ChangePasswordDocument,
  type ChangePasswordMutation,
  type ChangePasswordMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
} from '@/lib/schemas/user-settings/security.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';

interface ChangePasswordMessages {
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
}

interface ChangePasswordSectionProps {
  messages: ChangePasswordMessages;
  validation: ValidationDict;
  /** Callback del padre (SecurityOverviewClient) para refetchear mySecuritySettings. */
  onRefetchSecurity: () => void;
}

const DEFAULT_VALUES: ChangePasswordFormInput = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordSection({
  messages,
  validation,
  onRefetchSecurity,
}: ChangePasswordSectionProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  /**
   * Input del hook `useSectionMutation` (TParsed).
   * Solo enviamos al backend los campos del contrato; `confirmPassword`
   * es cliente-only y se descarta aquí.
   */
  const parseVariables = (
    input: ChangePasswordFormInput,
  ): ChangePasswordMutationVariables => ({
    input: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
  });

  /**
   * `INVALID_CURRENT_PASSWORD` y `CONFLICT` los mapeamos a mensajes
   * genéricos dentro de `errorCode`. El backend es la fuente de verdad
   * de esos códigos (contrato §3.8); la validación cliente solo
   * previene el caso trivial `newPassword === currentPassword`.
   */
  const mapError = (code: string): string | null => {
    switch (code) {
      case 'VALIDATION_ERROR':
        return messages.errors.VALIDATION_ERROR;
      case 'INVALID_CURRENT_PASSWORD':
        return messages.errors.INVALID_CURRENT_PASSWORD;
      case 'CONFLICT':
        return messages.errors.CONFLICT;
      case 'INTERNAL_ERROR':
        return messages.errors.INTERNAL_ERROR;
      default:
        return null;
    }
  };

  const { mutate, isSaving, errorCode, resetError } = useSectionMutation<
    ChangePasswordMutation,
    ChangePasswordMutationVariables,
    ChangePasswordFormInput
  >({
    document: ChangePasswordDocument,
    parseVariables,
    mapError,
    onSuccess: () => {
      reset(DEFAULT_VALUES);
      setIsSuccess(true);
      // Las mutaciones de Security no normalizan en graphcache; forzamos
      // un refetch network-only de mySecuritySettings. En este caso
      // concreto, el backend revoca otras sesiones como efecto
      // secundario del cambio de contraseña, así que el refetch también
      // actualiza el conteo de sesiones.
      onRefetchSecurity();
    },
  });

  const onSubmit: SubmitHandler<ChangePasswordFormInput> = async (values) => {
    setIsSuccess(false);
    resetError();
    await mutate(values);
  };

  const fieldError = (key?: string) => resolveError(validation, key);

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

      {isSuccess && (
        <p role="status" className="text-success mb-4 text-sm">
          {messages.successMessage}
        </p>
      )}

      <form
        className="grid gap-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-busy={isSaving}
      >
        <Controller
          name="currentPassword"
          control={control}
          render={({ field }) => (
            <InputField
              name="currentPassword"
              label={messages.fields.currentPassword.label}
              type={showCurrent ? 'text' : 'password'}
              value={field.value}
              onChange={field.onChange}
              placeholder={messages.fields.currentPassword.placeholder}
              autoComplete="current-password"
              error={fieldError(errors.currentPassword?.message)}
              disabled={isSaving}
              rightElement={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={showCurrent ? 'eyeOff' : 'eye'}
                  aria-label={
                    showCurrent
                      ? messages.fields.currentPassword.hide
                      : messages.fields.currentPassword.show
                  }
                  onClick={() => setShowCurrent((prev) => !prev)}
                />
              }
            />
          )}
        />

        <Controller
          name="newPassword"
          control={control}
          render={({ field }) => (
            <InputField
              name="newPassword"
              label={messages.fields.newPassword.label}
              type={showNew ? 'text' : 'password'}
              value={field.value}
              onChange={field.onChange}
              placeholder={messages.fields.newPassword.placeholder}
              autoComplete="new-password"
              error={fieldError(errors.newPassword?.message)}
              disabled={isSaving}
              rightElement={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={showNew ? 'eyeOff' : 'eye'}
                  aria-label={
                    showNew
                      ? messages.fields.newPassword.hide
                      : messages.fields.newPassword.show
                  }
                  onClick={() => setShowNew((prev) => !prev)}
                />
              }
            />
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <InputField
              name="confirmPassword"
              label={messages.fields.confirmPassword.label}
              type={showConfirm ? 'text' : 'password'}
              value={field.value}
              onChange={field.onChange}
              placeholder={messages.fields.confirmPassword.placeholder}
              autoComplete="new-password"
              error={fieldError(errors.confirmPassword?.message)}
              disabled={isSaving}
              rightElement={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={showConfirm ? 'eyeOff' : 'eye'}
                  aria-label={
                    showConfirm
                      ? messages.fields.newPassword.hide
                      : messages.fields.newPassword.show
                  }
                  onClick={() => setShowConfirm((prev) => !prev)}
                />
              }
            />
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            variant={!isDirty || !isValid || isSaving ? 'disabled' : 'primary'}
            disabled={!isDirty || !isValid || isSaving}
          >
            {isSaving ? messages.actions.saving : messages.actions.save}
          </Button>
        </div>
      </form>
    </section>
  );
}

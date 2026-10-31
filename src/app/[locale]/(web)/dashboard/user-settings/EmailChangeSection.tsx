'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import {
  RequestEmailChangeDocument,
  type RequestEmailChangeMutation,
  type RequestEmailChangeMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import {
  requestEmailChangeSchema,
  type RequestEmailChangeInput,
} from '@/lib/schemas/user-settings/security.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';

interface EmailChangeMessages {
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
}

interface EmailChangeSectionProps {
  messages: EmailChangeMessages;
  validation: ValidationDict;
  /** Email actual del usuario, para el refine "es tu correo actual". */
  currentEmail: string;
}

const DEFAULT_VALUES: RequestEmailChangeInput = { newEmail: '' };

export function EmailChangeSection({
  messages,
  validation,
  currentEmail,
}: EmailChangeSectionProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  // El schema depende del email actual (refine dinámico). Se memoiza
  // para que un re-render del padre no reconstruya el schema.
  const resolver = useMemo(
    () => zodResolver(requestEmailChangeSchema(currentEmail)),
    [currentEmail],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<RequestEmailChangeInput>({
    resolver,
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const parseVariables = (
    input: RequestEmailChangeInput,
  ): RequestEmailChangeMutationVariables => ({
    input: { newEmail: input.newEmail },
  });

  const mapError = (code: string): string | null => {
    switch (code) {
      case 'VALIDATION_ERROR':
        return messages.errors.VALIDATION_ERROR;
      case 'EMAIL_TAKEN':
        return messages.errors.EMAIL_TAKEN;
      case 'EMAIL_UNCHANGED':
        return messages.errors.EMAIL_UNCHANGED;
      case 'INTERNAL_ERROR':
        return messages.errors.INTERNAL_ERROR;
      default:
        return null;
    }
  };

  const { mutate, isSaving, errorCode, resetError } = useSectionMutation<
    RequestEmailChangeMutation,
    RequestEmailChangeMutationVariables,
    RequestEmailChangeInput
  >({
    document: RequestEmailChangeDocument,
    parseVariables,
    mapError,
    onSuccess: () => {
      reset(DEFAULT_VALUES);
      setIsSuccess(true);
      // NO refetcheamos mySecuritySettings: el contrato §3.8 indica que
      // el email no cambia hasta que el usuario confirme el enlace
      // enviado a la nueva dirección.
    },
  });

  const onSubmit: SubmitHandler<RequestEmailChangeInput> = async (values) => {
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
          name="newEmail"
          control={control}
          render={({ field }) => (
            <InputField
              name="newEmail"
              type="email"
              label={messages.fields.newEmail.label}
              value={field.value}
              onChange={field.onChange}
              placeholder={messages.fields.newEmail.placeholder}
              autoComplete="email"
              error={fieldError(errors.newEmail?.message)}
              disabled={isSaving}
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

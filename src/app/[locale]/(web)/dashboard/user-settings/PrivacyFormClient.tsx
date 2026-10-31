'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  MyPrivacySettingsDocument,
  UpdatePrivacySettingsDocument,
  type MyPrivacySettingsQuery,
  type ProfileVisibility,
  type UpdatePrivacySettingsInput,
  type UpdatePrivacySettingsMutation,
  type UpdatePrivacySettingsMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import {
  privacySchema,
  type PrivacyInput,
} from '@/lib/schemas/user-settings/privacy.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  useForm,
  useWatch,
  type FieldPath,
  type FieldPathValue,
  type SubmitHandler,
} from 'react-hook-form';
import { useQuery } from 'urql';

type PrivacyRecord = MyPrivacySettingsQuery['myPrivacySettings'];

interface PrivacyMessages {
  fields: {
    profileVisibility: { label: string };
    emailVisibility: { label: string };
    phoneVisibility: { label: string };
    allowDirectMessages: { label: string; description: string };
  };
  visibilityOptions: {
    everyone: string;
    authenticated: string;
    nobody: string;
  };
  actions: { save: string; saving: string };
  successMessage: string;
  errors: {
    VALIDATION_ERROR: string;
    INTERNAL_ERROR: string;
  };
}

interface PrivacyFormClientProps {
  messages: PrivacyMessages;
  validation: ValidationDict;
}

function toFormValues(data?: PrivacyRecord): PrivacyInput {
  return {
    profileVisibility: data?.profileVisibility ?? 'everyone',
    emailVisibility: data?.emailVisibility ?? 'everyone',
    phoneVisibility: data?.phoneVisibility ?? 'everyone',
    allowDirectMessages: data?.allowDirectMessages ?? false,
  };
}

export function PrivacyFormClient({
  messages,
  validation,
}: PrivacyFormClientProps) {
  const [queryResult] = useQuery({
    query: MyPrivacySettingsDocument,
    requestPolicy: 'cache-and-network',
  });
  const myPrivacySettings = queryResult.data?.myPrivacySettings;
  const defaults = myPrivacySettings ? toFormValues(myPrivacySettings) : {};
  const initialValuesRef = useRef<PrivacyInput | null>(
    myPrivacySettings ? defaults : null,
  );
  const loadedSnapshotRef = useRef<string | null>(
    myPrivacySettings ? JSON.stringify(myPrivacySettings) : null,
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm<PrivacyInput>({
    resolver: zodResolver(privacySchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const { reset } = form;
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (!myPrivacySettings) return;

    const snapshot = JSON.stringify(myPrivacySettings);
    if (loadedSnapshotRef.current === snapshot) return;

    const nextValues = toFormValues(myPrivacySettings);
    loadedSnapshotRef.current = snapshot;
    initialValuesRef.current = nextValues;
    reset(nextValues);
  }, [reset, myPrivacySettings]);

  const parseVariables = (
    input: PrivacyInput,
  ): UpdatePrivacySettingsMutationVariables => {
    const initial = initialValuesRef.current ?? toFormValues(myPrivacySettings);
    const patch: UpdatePrivacySettingsInput = {};

    if (input.profileVisibility !== initial.profileVisibility) {
      patch.profileVisibility = input.profileVisibility;
    }
    if (input.emailVisibility !== initial.emailVisibility) {
      patch.emailVisibility = input.emailVisibility;
    }
    if (input.phoneVisibility !== initial.phoneVisibility) {
      patch.phoneVisibility = input.phoneVisibility;
    }
    if (input.allowDirectMessages !== initial.allowDirectMessages) {
      patch.allowDirectMessages = input.allowDirectMessages;
    }

    return { input: patch };
  };

  const mapError = (code: string): string | null => {
    switch (code) {
      case 'VALIDATION_ERROR':
        return messages.errors.VALIDATION_ERROR;
      case 'INTERNAL_ERROR':
        return messages.errors.INTERNAL_ERROR;
      default:
        return null;
    }
  };

  const { mutate, isSaving, errorCode, resetError } = useSectionMutation<
    UpdatePrivacySettingsMutation,
    UpdatePrivacySettingsMutationVariables,
    PrivacyInput
  >({
    document: UpdatePrivacySettingsDocument,
    parseVariables,
    mapError,
    onSuccess: (data) => {
      const nextValues = toFormValues(data.updatePrivacySettings);
      initialValuesRef.current = nextValues;
      loadedSnapshotRef.current = JSON.stringify(data.updatePrivacySettings);
      reset(nextValues);
      setIsSuccess(true);
    },
  });

  const setFieldValue = <TField extends FieldPath<PrivacyInput>>(
    field: TField,
    value: FieldPathValue<PrivacyInput, TField>,
  ) => {
    setIsSuccess(false);
    resetError();
    form.setValue(field, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit: SubmitHandler<PrivacyInput> = async (values) => {
    setIsSuccess(false);
    await mutate(values);
  };

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={4} />;
  }

  if (!myPrivacySettings && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!myPrivacySettings) return null;

  const fieldError = (message?: string) => resolveError(validation, message);

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {queryResult.error && (
        <p role="alert" className="text-danger">
          {messages.errors.INTERNAL_ERROR}
        </p>
      )}

      {errorCode && (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {errorCode}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          name="profileVisibility"
          label={messages.fields.profileVisibility.label}
          value={watchedValues.profileVisibility}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) =>
            setFieldValue(
              'profileVisibility',
              event.target.value as ProfileVisibility,
            )
          }
          isSelect
          autoComplete="off"
          options={[
            {
              value: 'everyone',
              label: messages.visibilityOptions.everyone,
            },
            {
              value: 'authenticated',
              label: messages.visibilityOptions.authenticated,
            },
            { value: 'nobody', label: messages.visibilityOptions.nobody },
          ]}
          error={fieldError(form.formState.errors.profileVisibility?.message)}
        />

        <InputField
          name="emailVisibility"
          label={messages.fields.emailVisibility.label}
          value={watchedValues.emailVisibility}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) =>
            setFieldValue(
              'emailVisibility',
              event.target.value as ProfileVisibility,
            )
          }
          isSelect
          autoComplete="off"
          options={[
            {
              value: 'everyone',
              label: messages.visibilityOptions.everyone,
            },
            {
              value: 'authenticated',
              label: messages.visibilityOptions.authenticated,
            },
            { value: 'nobody', label: messages.visibilityOptions.nobody },
          ]}
          error={fieldError(form.formState.errors.emailVisibility?.message)}
        />

        <InputField
          name="phoneVisibility"
          label={messages.fields.phoneVisibility.label}
          value={watchedValues.phoneVisibility}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) =>
            setFieldValue(
              'phoneVisibility',
              event.target.value as ProfileVisibility,
            )
          }
          isSelect
          autoComplete="off"
          options={[
            {
              value: 'everyone',
              label: messages.visibilityOptions.everyone,
            },
            {
              value: 'authenticated',
              label: messages.visibilityOptions.authenticated,
            },
            { value: 'nobody', label: messages.visibilityOptions.nobody },
          ]}
          error={fieldError(form.formState.errors.phoneVisibility?.message)}
        />
      </div>

      <div>
        <label
          htmlFor="allowDirectMessages"
          className="text-foreground flex min-h-11 items-center gap-3 text-sm"
        >
          <input
            id="allowDirectMessages"
            type="checkbox"
            autoComplete="off"
            checked={Boolean(watchedValues.allowDirectMessages)}
            onChange={(event) =>
              setFieldValue('allowDirectMessages', event.currentTarget.checked)
            }
            aria-describedby={
              form.formState.errors.allowDirectMessages?.message
                ? 'allowDirectMessages-description allowDirectMessages-error'
                : 'allowDirectMessages-description'
            }
            className="accent-primary border-border focus-visible:outline-primary size-4 rounded"
          />
          {messages.fields.allowDirectMessages.label}
        </label>
        <p
          id="allowDirectMessages-description"
          className="text-foreground-muted ms-7 text-xs"
        >
          {messages.fields.allowDirectMessages.description}
        </p>
        {form.formState.errors.allowDirectMessages?.message && (
          <p
            id="allowDirectMessages-error"
            role="alert"
            className="text-danger ms-7 mt-1 text-sm"
          >
            {fieldError(form.formState.errors.allowDirectMessages.message)}
          </p>
        )}
      </div>

      {isSuccess && (
        <p role="status" className="text-success text-sm">
          {messages.successMessage}
        </p>
      )}

      <Button
        type="submit"
        variant={!form.formState.isDirty || isSaving ? 'disabled' : 'primary'}
        disabled={!form.formState.isDirty || isSaving}
      >
        {isSaving ? messages.actions.saving : messages.actions.save}
      </Button>
    </form>
  );
}

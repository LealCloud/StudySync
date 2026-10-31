'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  MyPreferencesDocument,
  UpdatePreferencesDocument,
  type MyPreferencesQuery,
  type UpdatePreferencesInput,
  type UpdatePreferencesMutation,
  type UpdatePreferencesMutationVariables,
} from '@/graphql/generated/graphql';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { isValidLanguage } from '@/lib/schemas/primitives';
import {
  preferencesSchema,
  type PreferencesInput,
} from '@/lib/schemas/user-settings/preferences.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  useForm,
  useWatch,
  type FieldPath,
  type FieldPathValue,
  type SubmitHandler,
} from 'react-hook-form';
import { useQuery } from 'urql';

type PreferencesRecord = MyPreferencesQuery['myPreferences'];

interface PreferencesMessages {
  fields: {
    language: {
      label: string;
      options: { es: string; en: string };
    };
    theme: {
      label: string;
      options: { system: string; light: string; dark: string };
    };
    timezone: { label: string; placeholder: string };
  };
  fieldsets: {
    general: string;
    notifications: string;
    accessibility: string;
  };
  notifications: {
    email: { label: string };
    push: { label: string };
    inApp: { label: string };
  };
  accessibility: {
    reducedMotion: { label: string };
    highContrast: { label: string };
  };
  notes: { theme: string };
  actions: { save: string; saving: string };
  successMessage: string;
  errors: {
    VALIDATION_ERROR: string;
    INTERNAL_ERROR: string;
  };
}

interface PreferencesFormClientProps {
  messages: PreferencesMessages;
  validation: ValidationDict;
}

function toFormValues(
  data: PreferencesRecord | undefined,
  fallbackLanguage: 'es' | 'en',
): PreferencesInput {
  return {
    language: isValidLanguage(data?.language)
      ? data.language
      : fallbackLanguage,
    theme: data?.theme ?? 'system',
    timezone: data?.timezone ?? 'UTC',
    notifications: {
      email: data?.notifications.email ?? false,
      push: data?.notifications.push ?? false,
      inApp: data?.notifications.inApp ?? false,
    },
    accessibility: {
      reducedMotion: data?.accessibility.reducedMotion ?? false,
      highContrast: data?.accessibility.highContrast ?? false,
    },
  };
}

export function PreferencesFormClient({
  messages,
  validation,
}: PreferencesFormClientProps) {
  const locale = useLocale();
  const fallbackLanguage = locale === 'en' ? 'en' : 'es';
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [queryResult] = useQuery({
    query: MyPreferencesDocument,
    requestPolicy: 'cache-and-network',
  });
  const myPreferences = queryResult.data?.myPreferences;
  const defaults = toFormValues(myPreferences, fallbackLanguage);
  const initialValuesRef = useRef<PreferencesInput | null>(
    myPreferences ? defaults : null,
  );
  const loadedSnapshotRef = useRef<string | null>(
    myPreferences ? JSON.stringify(myPreferences) : null,
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const { reset } = form;
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (!myPreferences) return;

    const snapshot = JSON.stringify(myPreferences);
    if (loadedSnapshotRef.current === snapshot) return;

    const nextValues = toFormValues(myPreferences, fallbackLanguage);
    loadedSnapshotRef.current = snapshot;
    initialValuesRef.current = nextValues;
    reset(nextValues);
  }, [fallbackLanguage, myPreferences, reset]);

  const parseVariables = (
    input: PreferencesInput,
  ): UpdatePreferencesMutationVariables => {
    const initial =
      initialValuesRef.current ?? toFormValues(myPreferences, fallbackLanguage);
    const patch: UpdatePreferencesInput = {};

    if (input.language !== undefined && input.language !== initial.language) {
      patch.language = input.language;
    }
    if (input.theme !== undefined && input.theme !== initial.theme) {
      patch.theme = input.theme;
    }
    if (input.timezone !== undefined && input.timezone !== initial.timezone) {
      patch.timezone = input.timezone;
    }

    const notifications: NonNullable<UpdatePreferencesInput['notifications']> =
      {};
    if (
      input.notifications?.email !== undefined &&
      input.notifications.email !== initial.notifications?.email
    ) {
      notifications.email = input.notifications.email;
    }
    if (
      input.notifications?.push !== undefined &&
      input.notifications.push !== initial.notifications?.push
    ) {
      notifications.push = input.notifications.push;
    }
    if (
      input.notifications?.inApp !== undefined &&
      input.notifications.inApp !== initial.notifications?.inApp
    ) {
      notifications.inApp = input.notifications.inApp;
    }
    if (Object.keys(notifications).length > 0) {
      patch.notifications = notifications;
    }

    const accessibility: NonNullable<UpdatePreferencesInput['accessibility']> =
      {};
    if (
      input.accessibility?.reducedMotion !== undefined &&
      input.accessibility.reducedMotion !== initial.accessibility?.reducedMotion
    ) {
      accessibility.reducedMotion = input.accessibility.reducedMotion;
    }
    if (
      input.accessibility?.highContrast !== undefined &&
      input.accessibility.highContrast !== initial.accessibility?.highContrast
    ) {
      accessibility.highContrast = input.accessibility.highContrast;
    }
    if (Object.keys(accessibility).length > 0) {
      patch.accessibility = accessibility;
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
    UpdatePreferencesMutation,
    UpdatePreferencesMutationVariables,
    PreferencesInput
  >({
    document: UpdatePreferencesDocument,
    parseVariables,
    mapError,
    onSuccess: (data) => {
      const nextValues = toFormValues(data.updatePreferences, fallbackLanguage);
      const previousValues =
        initialValuesRef.current ??
        toFormValues(myPreferences, fallbackLanguage);
      const languageChanged = nextValues.language !== previousValues.language;
      const themeChanged = nextValues.theme !== previousValues.theme;

      reset(nextValues);
      initialValuesRef.current = nextValues;
      loadedSnapshotRef.current = JSON.stringify(data.updatePreferences);

      if (themeChanged && nextValues.theme) setTheme(nextValues.theme);
      setIsSuccess(true);
      if (languageChanged) {
        router.replace(pathname, { locale: nextValues.language });
      }
    },
  });

  const setFieldValue = <TField extends FieldPath<PreferencesInput>>(
    field: TField,
    value: FieldPathValue<PreferencesInput, TField>,
  ) => {
    setIsSuccess(false);
    resetError();
    form.setValue(field, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit: SubmitHandler<PreferencesInput> = async (values) => {
    setIsSuccess(false);
    await mutate(values);
  };

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={4} />;
  }

  if (!myPreferences && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!myPreferences) return null;

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

      <fieldset className="grid gap-4 border-0 p-0 sm:grid-cols-2">
        <legend className="text-foreground mb-1 text-sm font-semibold">
          {messages.fieldsets.general}
        </legend>

        <InputField
          name="language"
          label={messages.fields.language.label}
          value={watchedValues.language}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) => setFieldValue('language', event.target.value as 'es' | 'en')}
          isSelect
          options={[
            { value: 'es', label: messages.fields.language.options.es },
            { value: 'en', label: messages.fields.language.options.en },
          ]}
          error={fieldError(form.formState.errors.language?.message)}
        />

        <div>
          <InputField
            name="theme"
            label={messages.fields.theme.label}
            value={watchedValues.theme}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) =>
              setFieldValue(
                'theme',
                event.target.value as 'system' | 'light' | 'dark',
              )
            }
            isSelect
            options={[
              { value: 'system', label: messages.fields.theme.options.system },
              { value: 'light', label: messages.fields.theme.options.light },
              { value: 'dark', label: messages.fields.theme.options.dark },
            ]}
            error={fieldError(form.formState.errors.theme?.message)}
          />
          <p className="text-foreground-muted mt-2 text-xs">
            {messages.notes.theme}
          </p>
        </div>

        {/* TODO(timezone-select): reemplazar por <select> con catálogo IANA
            (src/config/timezones.ts) para evitar que el usuario tenga que
            escribir el identificador a mano. Requiere sub-fase nueva
            (~600 entradas). Diferido a Fase 6+. */}
        <InputField
          name="timezone"
          type="text"
          label={messages.fields.timezone.label}
          value={watchedValues.timezone}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) => setFieldValue('timezone', event.target.value)}
          placeholder={messages.fields.timezone.placeholder}
          error={fieldError(form.formState.errors.timezone?.message)}
        />
      </fieldset>

      <fieldset className="grid gap-4 border-0 p-0 sm:grid-cols-2">
        <legend className="text-foreground mb-1 text-sm font-semibold">
          {messages.fieldsets.notifications}
        </legend>

        {(['email', 'push', 'inApp'] as const).map((field) => {
          const id = `notifications-${field}`;
          return (
            <label
              key={field}
              htmlFor={id}
              className="text-foreground flex min-h-11 items-center gap-3 text-sm"
            >
              <input
                id={id}
                type="checkbox"
                checked={Boolean(watchedValues.notifications?.[field])}
                onChange={(event) =>
                  setFieldValue(
                    `notifications.${field}`,
                    event.currentTarget.checked,
                  )
                }
                className="accent-primary border-border focus-visible:outline-primary size-4 rounded"
              />
              {messages.notifications[field].label}
            </label>
          );
        })}
      </fieldset>

      <fieldset className="grid gap-4 border-0 p-0 sm:grid-cols-2">
        <legend className="text-foreground mb-1 text-sm font-semibold">
          {messages.fieldsets.accessibility}
        </legend>

        {(['reducedMotion', 'highContrast'] as const).map((field) => {
          const id = `accessibility-${field}`;
          return (
            <label
              key={field}
              htmlFor={id}
              className="text-foreground flex min-h-11 items-center gap-3 text-sm"
            >
              <input
                id={id}
                type="checkbox"
                checked={Boolean(watchedValues.accessibility?.[field])}
                onChange={(event) =>
                  setFieldValue(
                    `accessibility.${field}`,
                    event.currentTarget.checked,
                  )
                }
                className="accent-primary border-border focus-visible:outline-primary size-4 rounded"
              />
              {messages.accessibility[field].label}
            </label>
          );
        })}
      </fieldset>

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

'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  MyProfileDocument,
  UpdateProfileDocument,
  type MyProfileQuery,
  type UpdateBioInput,
  type UpdateProfileInput,
  type UpdateProfileMutation,
  type UpdateProfileMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import {
  profileSchema,
  type ProfileInput,
} from '@/lib/schemas/user-settings/profile.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import {
  useForm,
  useWatch,
  type FieldPath,
  type FieldPathValue,
  type SubmitHandler,
} from 'react-hook-form';
import { useQuery } from 'urql';

type ProfileRecord = MyProfileQuery['me'];

interface ProfileFormMessages {
  fields: {
    bio: {
      title: { label: string; placeholder: string };
      description: { label: string; placeholder: string };
    };
    interests: {
      label: string;
      placeholder: string;
      addButton: string;
      removeAria: string;
    };
  };
  actions: { save: string; saving: string };
  successMessage: string;
  errors: {
    VALIDATION_ERROR: string;
    INTERNAL_ERROR: string;
  };
}

interface ProfileFormClientProps {
  messages: ProfileFormMessages;
  validation: ValidationDict;
}

function toFormValues(data?: ProfileRecord): ProfileInput {
  return {
    bio: {
      title: data?.profile.bio?.title ?? null,
      description: data?.profile.bio?.description ?? null,
    },
    interests: data?.profile.interests ?? [],
  };
}

export function ProfileFormClient({
  messages,
  validation,
}: ProfileFormClientProps) {
  const [queryResult] = useQuery({
    query: MyProfileDocument,
    requestPolicy: 'cache-and-network',
  });
  const myProfile = queryResult.data?.me;
  const defaults = myProfile ? toFormValues(myProfile) : {};
  const [isSuccess, setIsSuccess] = useState(false);
  const initialValuesRef = useRef<ProfileInput | null>(
    myProfile ? toFormValues(myProfile) : null,
  );
  const loadedSnapshotRef = useRef<string | null>(
    myProfile ? JSON.stringify(myProfile) : null,
  );
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const { reset } = form;
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (!myProfile) return;

    const snapshot = JSON.stringify(myProfile);
    if (loadedSnapshotRef.current === snapshot) return;

    const nextValues = toFormValues(myProfile);
    loadedSnapshotRef.current = snapshot;
    initialValuesRef.current = nextValues;
    reset(nextValues);
  }, [myProfile, reset]);

  const parseVariables = (
    input: ProfileInput,
  ): UpdateProfileMutationVariables => {
    const initial = initialValuesRef.current ?? toFormValues(myProfile);
    const patch: UpdateProfileInput = {};

    if (input.bio !== undefined) {
      if (input.bio === null) {
        patch.bio = null;
      } else {
        const bioPatch: UpdateBioInput = {};

        if (
          input.bio.title !== undefined &&
          input.bio.title !== initial.bio?.title
        ) {
          bioPatch.title = input.bio.title;
        }

        if (
          input.bio.description !== undefined &&
          input.bio.description !== initial.bio?.description
        ) {
          bioPatch.description = input.bio.description;
        }

        if (Object.keys(bioPatch).length > 0) {
          patch.bio = bioPatch;
        }
      }
    }

    if (
      input.interests !== undefined &&
      JSON.stringify(input.interests) !== JSON.stringify(initial.interests)
    ) {
      patch.interests = input.interests;
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
    UpdateProfileMutation,
    UpdateProfileMutationVariables,
    ProfileInput
  >({
    document: UpdateProfileDocument,
    parseVariables,
    mapError,
    onSuccess: (data) => {
      const nextValues = toFormValues(data.updateProfile);
      initialValuesRef.current = nextValues;
      loadedSnapshotRef.current = JSON.stringify(data.updateProfile);
      reset(nextValues);
      setIsSuccess(true);
    },
  });

  const setFieldValue = <TField extends FieldPath<ProfileInput>>(
    field: TField,
    value: FieldPathValue<ProfileInput, TField>,
  ) => {
    setIsSuccess(false);
    resetError();
    form.setValue(field, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit: SubmitHandler<ProfileInput> = async (values) => {
    setIsSuccess(false);
    await mutate(values);
  };

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={4} />;
  }

  if (!myProfile && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!myProfile) return null;

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

      <div className="grid gap-4">
        <InputField
          name="bio-title"
          label={messages.fields.bio.title.label}
          value={watchedValues.bio?.title ?? ''}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) => setFieldValue('bio.title', event.target.value)}
          placeholder={messages.fields.bio.title.placeholder}
          error={fieldError(form.formState.errors.bio?.title?.message)}
        />

        <div className="grid gap-1.5">
          <label
            htmlFor="bio-description"
            className="text-foreground text-sm font-semibold"
          >
            {messages.fields.bio.description.label}
          </label>
          <textarea
            id="bio-description"
            name="bio-description"
            value={watchedValues.bio?.description ?? ''}
            onChange={(event) =>
              setFieldValue('bio.description', event.target.value)
            }
            placeholder={messages.fields.bio.description.placeholder}
            aria-invalid={Boolean(
              form.formState.errors.bio?.description?.message,
            )}
            aria-describedby={
              form.formState.errors.bio?.description?.message
                ? 'bio-description-error'
                : undefined
            }
            className="border-border bg-surface text-foreground placeholder:text-foreground-subtle focus:border-border-focus min-h-28 w-full rounded-xl border px-3.5 py-3 text-sm outline-none"
          />
          {form.formState.errors.bio?.description?.message && (
            <p
              id="bio-description-error"
              role="alert"
              className="text-danger text-sm"
            >
              {fieldError(form.formState.errors.bio.description.message)}
            </p>
          )}
        </div>
      </div>

      <InterestsField
        value={watchedValues.interests ?? []}
        onChange={(value) => setFieldValue('interests', value)}
        messages={messages.fields.interests}
        error={fieldError(form.formState.errors.interests?.message)}
      />

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

interface InterestsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  messages: ProfileFormMessages['fields']['interests'];
  error?: string;
}

function InterestsField({
  value,
  onChange,
  messages,
  error,
}: InterestsFieldProps) {
  const [inputValue, setInputValue] = useState<string>('');

  const addInterest = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= 20) return;

    onChange([...value, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addInterest();
  };

  return (
    <div className="grid gap-2">
      <label
        htmlFor="profile-interests"
        className="text-foreground text-sm font-semibold"
      >
        {messages.label}
      </label>

      <div className="flex flex-wrap gap-2">
        {value.map((interest, index) => (
          <span
            key={`${interest}-${index}`}
            className="border-border bg-surface text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
          >
            {interest}
            <button
              type="button"
              aria-label={messages.removeAria}
              onClick={() =>
                onChange(value.filter((_, itemIndex) => itemIndex !== index))
              }
              className="text-foreground-muted hover:text-danger focus-visible:outline-primary rounded-full text-base leading-none"
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="profile-interests"
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={messages.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'profile-interests-error' : undefined}
          className="border-border bg-surface text-foreground placeholder:text-foreground-subtle focus:border-border-focus min-h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-sm outline-none"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={addInterest}
          disabled={
            !inputValue.trim() ||
            value.includes(inputValue.trim()) ||
            value.length >= 20
          }
        >
          {messages.addButton}
        </Button>
      </div>

      {error && (
        <p
          id="profile-interests-error"
          role="alert"
          className="text-danger text-sm"
        >
          {error}
        </p>
      )}
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import { getCountriesSorted } from '@/config/countries';
import {
  MyPersonalDataDocument,
  UpdatePersonalDataDocument,
  type MyPersonalDataQuery,
  type UpdatePersonalDataInput,
  type UpdatePersonalDataMutation,
  type UpdatePersonalDataMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import {
  personalDataSchema,
  type PersonalDataInput,
} from '@/lib/schemas/user-settings/personal-data.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { useQuery } from 'urql';

type PersonalDataRecord = MyPersonalDataQuery['myPersonalData'];

interface PersonalDataMessages {
  fields: {
    firstName: { label: string; placeholder: string };
    lastName: { label: string; placeholder: string };
    documentType: { label: string };
    documentId: { label: string; placeholder: string };
    phone: { label: string; placeholder: string };
    country: { label: string };
    address: { label: string; placeholder: string };
  };
  documentType: { passport: string; dni: string };
  emptyOption: string;
  locked: { description: string; badge: string };
  fieldsets: { identity: string; contact: string };
  actions: { save: string; saving: string };
  successMessage: string;
  errors: {
    VALIDATION_ERROR: string;
    FORBIDDEN: string;
    CONFLICT: string;
    INTERNAL_ERROR: string;
  };
}

interface PersonalDataFormClientProps {
  messages: PersonalDataMessages;
  validation: ValidationDict;
}

function toFormValues(data?: PersonalDataRecord): PersonalDataInput {
  return {
    firstName: data?.firstName ?? '',
    lastName: data?.lastName ?? '',
    documentType: data?.documentType ?? null,
    documentId: data?.documentId ?? null,
    phone: data?.phone ?? null,
    country: data?.country ?? null,
    address: data?.address ?? null,
  };
}

export function PersonalDataFormClient({
  messages,
  validation,
}: PersonalDataFormClientProps) {
  const locale = useLocale();
  const countryLocale = locale === 'en' ? 'en' : 'es';
  const [queryResult] = useQuery({
    query: MyPersonalDataDocument,
    requestPolicy: 'cache-and-network',
  });
  const myPersonalData = queryResult.data?.myPersonalData;
  const defaults = toFormValues(myPersonalData);
  const initialValuesRef = useRef<PersonalDataInput | null>(
    myPersonalData ? defaults : null,
  );
  const loadedSnapshotRef = useRef<string | null>(
    myPersonalData ? JSON.stringify(myPersonalData) : null,
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm<PersonalDataInput>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const { reset } = form;
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (!myPersonalData) return;

    const snapshot = JSON.stringify(myPersonalData);
    if (loadedSnapshotRef.current === snapshot) return;

    const nextValues = toFormValues(myPersonalData);
    loadedSnapshotRef.current = snapshot;
    initialValuesRef.current = nextValues;
    reset(nextValues);
  }, [reset, myPersonalData]);

  const identityLocked = myPersonalData?.identityLocked ?? false;

  const parseVariables = (
    input: PersonalDataInput,
  ): UpdatePersonalDataMutationVariables => {
    const initial = initialValuesRef.current ?? toFormValues(myPersonalData);
    const patch: UpdatePersonalDataInput = {};

    if (!identityLocked) {
      if (input.firstName !== initial.firstName) {
        patch.firstName = input.firstName;
      }
      if (input.lastName !== initial.lastName) {
        patch.lastName = input.lastName;
      }
      if (input.documentType !== initial.documentType) {
        patch.documentType = input.documentType;
        // Excepción al PATCH diferencial: si cambia el tipo de documento,
        // reenviar siempre el documentId para que el backend revalide la
        // pareja (documentType, documentId) en el estado final.
        patch.documentId = input.documentId;
      } else if (input.documentId !== initial.documentId) {
        patch.documentId = input.documentId;
      }
    }

    if (input.phone !== initial.phone) patch.phone = input.phone;
    if (input.country !== initial.country) patch.country = input.country;
    if (input.address !== initial.address) patch.address = input.address;

    return { input: patch };
  };

  const mapError = (code: string): string | null => {
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
  };

  const { mutate, isSaving, errorCode, resetError } = useSectionMutation<
    UpdatePersonalDataMutation,
    UpdatePersonalDataMutationVariables,
    PersonalDataInput
  >({
    document: UpdatePersonalDataDocument,
    parseVariables,
    mapError,
    onSuccess: (data) => {
      const nextValues = toFormValues(data.updatePersonalData);
      initialValuesRef.current = nextValues;
      loadedSnapshotRef.current = JSON.stringify(data.updatePersonalData);
      reset(nextValues);
      setIsSuccess(true);
    },
  });

  const setFieldValue = <K extends keyof PersonalDataInput>(
    field: K,
    value: PersonalDataInput[K],
  ) => {
    setIsSuccess(false);
    resetError();
    form.setValue(field, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit: SubmitHandler<PersonalDataInput> = async (values) => {
    setIsSuccess(false);
    await mutate(values);
  };

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={4} />;
  }

  if (!myPersonalData && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!myPersonalData) return null;

  const currentDocumentType = watchedValues.documentType;
  const currentDocumentId = watchedValues.documentId;
  const missingRequiredDocumentId =
    Boolean(currentDocumentType) && !currentDocumentId?.trim();
  const countries = getCountriesSorted(countryLocale);
  const fieldError = (message?: string) => resolveError(validation, message);

  const identityField = (children: React.ReactNode) => (
    <div
      className="relative"
      title={identityLocked ? messages.locked.description : undefined}
    >
      {children}
      {identityLocked && (
        <span className="bg-disabled text-disabled-text absolute top-0 right-0 rounded-full px-2 py-0.5 text-[10px] font-medium">
          {messages.locked.badge}
        </span>
      )}
    </div>
  );

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

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-foreground mb-4 text-sm font-semibold">
          {messages.fieldsets.identity}
        </legend>

        {identityField(
          <InputField
            name="firstName"
            label={messages.fields.firstName.label}
            value={watchedValues.firstName}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) => setFieldValue('firstName', event.target.value)}
            placeholder={messages.fields.firstName.placeholder}
            error={fieldError(form.formState.errors.firstName?.message)}
            disabled={identityLocked}
          />,
        )}

        {identityField(
          <InputField
            name="lastName"
            label={messages.fields.lastName.label}
            value={watchedValues.lastName}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) => setFieldValue('lastName', event.target.value)}
            placeholder={messages.fields.lastName.placeholder}
            error={fieldError(form.formState.errors.lastName?.message)}
            disabled={identityLocked}
          />,
        )}

        {identityField(
          <InputField
            name="documentType"
            label={messages.fields.documentType.label}
            value={watchedValues.documentType ?? ''}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) => {
              const value = event.target.value;
              setFieldValue(
                'documentType',
                value === '' ? null : (value as 'passport' | 'dni'),
              );
              if (value === '') setFieldValue('documentId', null);
            }}
            isSelect
            options={[
              { value: '', label: messages.emptyOption },
              { value: 'passport', label: messages.documentType.passport },
              { value: 'dni', label: messages.documentType.dni },
            ]}
            error={fieldError(form.formState.errors.documentType?.message)}
            disabled={identityLocked}
            required={false}
          />,
        )}

        {identityField(
          <InputField
            name="documentId"
            label={messages.fields.documentId.label}
            value={watchedValues.documentId}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) => setFieldValue('documentId', event.target.value || null)}
            placeholder={messages.fields.documentId.placeholder}
            error={fieldError(form.formState.errors.documentId?.message)}
            disabled={identityLocked}
            required={Boolean(currentDocumentType)}
          />,
        )}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-foreground mb-4 text-sm font-semibold">
          {messages.fieldsets.contact}
        </legend>

        <InputField
          name="phone"
          label={messages.fields.phone.label}
          value={watchedValues.phone}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) => setFieldValue('phone', event.target.value || null)}
          placeholder={messages.fields.phone.placeholder}
          error={fieldError(form.formState.errors.phone?.message)}
          required={false}
        />

        <InputField
          name="country"
          label={messages.fields.country.label}
          value={watchedValues.country ?? ''}
          onChange={(
            event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
          ) => setFieldValue('country', event.target.value || null)}
          isSelect
          options={[
            { value: '', label: messages.emptyOption },
            ...countries.map((country) => ({
              value: country.code,
              label: countryLocale === 'en' ? country.nameEn : country.nameEs,
            })),
          ]}
          error={fieldError(form.formState.errors.country?.message)}
          required={false}
        />

        <div className="sm:col-span-2">
          <InputField
            name="address"
            label={messages.fields.address.label}
            value={watchedValues.address}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) => setFieldValue('address', event.target.value || null)}
            placeholder={messages.fields.address.placeholder}
            error={fieldError(form.formState.errors.address?.message)}
            required={false}
          />
        </div>
      </fieldset>

      {isSuccess && (
        <p role="status" className="text-success text-sm">
          {messages.successMessage}
        </p>
      )}

      <Button
        type="submit"
        variant={
          !form.formState.isDirty || isSaving || missingRequiredDocumentId
            ? 'disabled'
            : 'primary'
        }
        disabled={
          !form.formState.isDirty || isSaving || missingRequiredDocumentId
        }
      >
        {isSaving ? messages.actions.saving : messages.actions.save}
      </Button>
    </form>
  );
}

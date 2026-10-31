'use client';

import { Button } from '@/components/ui/Button';
import { useSidebarData } from '@/components/layout/dashboard/sidebar/useSidebarData';
import {
  UpdateProfileDocument,
  type UpdateProfileMutation,
  type UpdateProfileMutationVariables,
} from '@/graphql/generated/graphql';
import { getRoleTranslationKey } from '@/config/dashboard-navigation';
import { AppIcon } from '@/lib/iconMap';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AvatarMessages {
  fallbackName: string;
  fallbackEmail: string;
  title: string;
  description: string;
  changeAria: string;
  uploadAria: string;
  save: string;
  saving: string;
  cancel: string;
  change: string;
  upload: string;
  remove: string;
  limit: string;
  previewTitle: string;
  visibility: string;
  saved: string;
  removed: string;
  errors: {
    unsupportedType: string;
    fileTooLarge: string;
    uploadFailed: string;
    removeFailed: string;
  };
}

interface ProfileAvatarSettingsProps {
  messages: AvatarMessages;
}

export function ProfileAvatarSettings({
  messages,
}: ProfileAvatarSettingsProps) {
  const { name, email, image, role } = useSidebarData();
  const rolesT = useTranslations('dashboard.navigation.roles');
  const roleLabel = rolesT(getRoleTranslationKey(role));

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingPreviewRef = useRef<string | null>(null);
  const lastActionRef = useRef<'save' | 'remove' | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentImage = image;
  const displayImage = pendingPreview ?? currentImage;
  const hasPendingChange = !!pendingFile;

  useEffect(
    () => () => {
      if (pendingPreviewRef.current) {
        URL.revokeObjectURL(pendingPreviewRef.current);
        pendingPreviewRef.current = null;
      }
    },
    [],
  );

  const handleCancel = () => {
    if (pendingPreview && pendingPreview !== currentImage) {
      URL.revokeObjectURL(pendingPreview);
    }
    pendingPreviewRef.current = null;
    setPendingPreview(null);
    setPendingFile(null);
    setError(null);
    setFeedback(null);
    resetError();
  };

  const { mutate, isSaving, errorCode, resetError } = useSectionMutation<
    UpdateProfileMutation,
    UpdateProfileMutationVariables,
    string | null
  >({
    document: UpdateProfileDocument,
    parseVariables: (dataUri) => ({ input: { image: dataUri } }),
    mapError: (code) =>
      code === 'VALIDATION_ERROR' || code === 'INTERNAL_ERROR'
        ? messages.errors.uploadFailed
        : null,
    onSuccess: () => {
      const action = lastActionRef.current;
      lastActionRef.current = null;
      handleCancel();
      setFeedback(action === 'remove' ? messages.removed : messages.saved);
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      pendingPreviewRef.current = null;
      setPendingPreview(null);
      setPendingFile(null);
      setFeedback(null);
      setError(messages.errors.unsupportedType);
      resetError();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      pendingPreviewRef.current = null;
      setPendingPreview(null);
      setPendingFile(null);
      setFeedback(null);
      setError(messages.errors.fileTooLarge);
      resetError();
      return;
    }

    setError(null);
    setFeedback(null);
    resetError();
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    const preview = URL.createObjectURL(file);
    pendingPreviewRef.current = preview;
    setPendingPreview(preview);
  };

  const handleSave = async () => {
    if (!pendingFile) return;

    setError(null);
    setFeedback(null);
    resetError();

    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('FileReader did not return a data URI'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(pendingFile);
      });

      lastActionRef.current = 'save';
      await mutate(dataUri);
    } catch {
      setError(messages.errors.uploadFailed);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setFeedback(null);
    resetError();
    lastActionRef.current = 'remove';
    await mutate(null);
  };

  // `errorCode` (error de mutación) tiene prioridad sobre `error` (error local
  // de validación de archivo), porque el de mutación es el más reciente y
  // crítico.
  const displayError = errorCode ?? error;

  return (
    <section className="border-border bg-surface rounded-3xl border p-6 sm:p-8">
      <header className="mb-6">
        <h2 className="text-foreground text-lg font-semibold">
          {messages.title}
        </h2>
        <p className="text-foreground-muted mt-1 text-sm">
          {messages.description}
        </p>
      </header>

      <div className="grid gap-8 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label={
                currentImage ? messages.changeAria : messages.uploadAria
              }
              className="group border-border bg-background focus-visible:ring-primary relative size-32 overflow-hidden rounded-full border focus-visible:ring-2 focus-visible:outline-none"
            >
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-foreground flex size-full items-center justify-center text-4xl font-bold"
                >
                  {(name ?? messages.fallbackName).charAt(0).toUpperCase()}
                </span>
              )}
              <span className="bg-foreground/40 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <AppIcon
                  category="ui"
                  name="camera"
                  className="text-background size-6"
                />
              </span>
            </button>

            {currentImage && (
              <span
                aria-hidden="true"
                className="bg-success text-success-foreground border-surface absolute right-0.5 bottom-0.5 flex size-6 items-center justify-center rounded-full border-2"
              >
                <AppIcon
                  category="ui"
                  name="checkCircle"
                  className="size-3.5"
                />
              </span>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />

          {hasPendingChange ? (
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? messages.saving : messages.save}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {messages.cancel}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button
                variant="social"
                size="sm"
                icon="upload"
                onClick={() => inputRef.current?.click()}
              >
                {currentImage ? messages.change : messages.upload}
              </Button>
              {currentImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  onClick={handleRemove}
                  disabled={isSaving}
                  className="hover:bg-danger/10 hover:text-danger"
                >
                  {messages.remove}
                </Button>
              )}
            </div>
          )}

          {displayError && (
            <p
              role="alert"
              className="text-danger text-center text-xs leading-relaxed"
            >
              {displayError}
            </p>
          )}

          {feedback && !displayError && (
            <p role="status" className="text-success text-center text-xs">
              {feedback}
            </p>
          )}

          <p className="text-foreground-subtle text-center text-xs sm:text-left">
            {messages.limit}
          </p>
        </div>

        <div className="border-border flex flex-col gap-3 border-t pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
          <span className="text-foreground-muted text-xs font-semibold">
            {messages.previewTitle}
          </span>

          <div className="border-border bg-background flex items-center gap-3 rounded-xl border p-3">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt=""
                className="border-border size-10 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {(name ?? messages.fallbackName).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm leading-tight font-bold">
                {name ?? messages.fallbackName}
              </p>
              <p className="text-foreground-subtle truncate text-xs">
                {email ?? messages.fallbackEmail}
              </p>
              <p className="text-foreground-muted truncate text-xs font-medium">
                {roleLabel}
              </p>
            </div>
          </div>

          <p className="text-foreground-subtle flex items-center gap-1.5 text-xs">
            <AppIcon
              category="ui"
              name="lockOpen"
              className="size-3.5 shrink-0"
            />
            {messages.visibility}
          </p>
        </div>
      </div>
    </section>
  );
}

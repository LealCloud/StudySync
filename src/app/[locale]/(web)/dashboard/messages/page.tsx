import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import { auth } from '@/auth';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { MessagingClient, type MessagingMessages } from './MessagingClient';

export default async function MessagesPage() {
  const [session, t, locale] = await Promise.all([
    auth(),
    getTranslations('dashboard.messages'),
    getLocale(),
  ]);

  if (!session?.user) redirect(`/${locale}/login`);

  const messages: MessagingMessages = {
    title: t('title'),
    description: t('description'),
    emptyConversations: t('emptyConversations'),
    selectConversation: t('selectConversation'),
    sendMessagePlaceholder: t('sendMessagePlaceholder'),
    send: t('send'),
    sending: t('sending'),
    backToList: t('backToList'),
    errors: {
      INTERNAL_ERROR: t('errors.INTERNAL_ERROR'),
      FORBIDDEN: t('errors.FORBIDDEN'),
      NOT_FOUND: t('errors.NOT_FOUND'),
      VALIDATION_ERROR: t('errors.VALIDATION_ERROR'),
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header fuera del Suspense: se ve mientras `useSearchParams`
          resuelve, sin flash de skeleton. */}
      <header className="mb-6">
        <h1 className="text-foreground text-2xl font-semibold">
          {messages.title}
        </h1>
        <p className="text-foreground-muted mt-1 text-sm">
          {messages.description}
        </p>
      </header>

      <Suspense
        fallback={
          <div aria-busy="true">
            <SettingsSkeleton rows={5} />
          </div>
        }
      >
        <MessagingClient messages={messages} currentUserId={session.user.id} />
      </Suspense>
    </main>
  );
}

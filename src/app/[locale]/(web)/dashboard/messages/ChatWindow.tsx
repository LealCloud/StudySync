'use client';

import { Button } from '@/components/ui/Button';
import {
  MarkConversationAsReadDocument,
  MessagesDocument,
  SendMessageDocument,
  type MarkConversationAsReadMutation,
  type MarkConversationAsReadMutationVariables,
  type MessagesQuery,
  type SendMessageMutation,
  type SendMessageMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useQuery } from 'urql';
import type { ConversationRecord } from './ConversationList';
import type { MessagingMessages } from './MessagingClient';

interface ChatWindowProps {
  conversation: ConversationRecord;
  currentUserId: string;
  onBack: () => void;
  messages: MessagingMessages;
}

type MessageRecord = MessagesQuery['messages'][number];

function errorMessage(code: unknown, messages: MessagingMessages): string {
  if (typeof code === 'string' && code in messages.errors) {
    return messages.errors[code as keyof MessagingMessages['errors']];
  }
  return messages.errors.INTERNAL_ERROR;
}

function formatTime(value: unknown, locale: string): string {
  if (typeof value !== 'string') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  messages,
}: ChatWindowProps) {
  const locale = useLocale();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const markedConversationRef = useRef<string | null>(null);
  const otherParticipant = conversation.participants.find(
    (participant) => participant.user.id !== currentUserId,
  )?.user;
  const [queryResult, executeMessages] = useQuery({
    query: MessagesDocument,
    variables: { conversationId: conversation.id, limit: 50 },
    requestPolicy: 'cache-and-network',
    pause: !conversation.id,
  });

  // TODO(polling-visibility): mover esta lógica a un hook compartido
  // (`usePolling`) que respete `document.visibilityState` y pause el
  // intervalo cuando la pestaña está oculta. Hoy el polling corre
  // mientras el componente esté montado, incluso en background.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void executeMessages({ requestPolicy: 'network-only' });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [executeMessages]);

  const parseConversationId = useCallback(
    (): MarkConversationAsReadMutationVariables => ({
      conversationId: conversation.id,
    }),
    [conversation.id],
  );
  const { mutate: markAsRead } = useSectionMutation<
    MarkConversationAsReadMutation,
    MarkConversationAsReadMutationVariables,
    void
  >({
    document: MarkConversationAsReadDocument,
    parseVariables: parseConversationId,
  });

  useEffect(() => {
    if (
      conversation.unreadCount > 0 &&
      markedConversationRef.current !== conversation.id
    ) {
      markedConversationRef.current = conversation.id;
      void markAsRead();
    }
  }, [conversation.id, conversation.unreadCount, markAsRead]);

  const parseSendVariables = useCallback(
    (content: string): SendMessageMutationVariables => ({
      conversationId: conversation.id,
      content,
    }),
    [conversation.id],
  );
  const mapSendError = useCallback(
    (code: string) => errorMessage(code, messages),
    [messages],
  );
  const {
    mutate: sendMessage,
    isSaving,
    errorCode: sendError,
  } = useSectionMutation<
    SendMessageMutation,
    SendMessageMutationVariables,
    string
  >({
    document: SendMessageDocument,
    parseVariables: parseSendVariables,
    mapError: mapSendError,
  });

  const messagesList: MessageRecord[] = queryResult.data?.messages ?? [];
  const lastMessageId = messagesList.at(-1)?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lastMessageId]);

  const submitMessage = async () => {
    if (!draft.trim() || isSaving) return;
    const result = await sendMessage(draft);
    if (result.ok) setDraft('');
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const queryError = queryResult.error
    ? errorMessage(
        queryResult.error.graphQLErrors[0]?.extensions?.code,
        messages,
      )
    : null;

  return (
    <section className="border-border bg-surface flex min-h-[70vh] w-full min-w-0 flex-col overflow-hidden rounded-3xl border">
      <header className="border-border flex items-center gap-3 border-b p-4 sm:px-5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon="chevronLeft"
          aria-label={messages.backToList}
          className="lg:hidden"
          onClick={onBack}
        />
        <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold">
          {otherParticipant?.image ? (
            <Image
              src={otherParticipant.image}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            otherParticipant?.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0] ?? '')
              .join('')
              .toLocaleUpperCase()
          )}
        </span>
        <h2 className="text-foreground min-w-0 truncate text-sm font-semibold">
          {otherParticipant?.name ?? ''}
        </h2>
      </header>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5"
        aria-live="polite"
        aria-label={messages.title}
      >
        {queryResult.fetching && !queryResult.data ? (
          <div className="space-y-3" aria-hidden="true">
            <div className="bg-surface-hover h-10 w-2/3 animate-pulse rounded-2xl" />
            <div className="bg-surface-hover ml-auto h-10 w-1/2 animate-pulse rounded-2xl" />
            <div className="bg-surface-hover h-10 w-3/5 animate-pulse rounded-2xl" />
          </div>
        ) : queryError && !queryResult.data ? (
          <p role="alert" className="text-danger text-sm">
            {queryError}
          </p>
        ) : messagesList.length === 0 ? (
          <p
            role="status"
            className="text-foreground-muted py-8 text-center text-sm"
          >
            {messages.selectConversation}
          </p>
        ) : (
          <ol className="space-y-3">
            {messagesList.map((message) => {
              const createdAt =
                typeof message.createdAt === 'string'
                  ? message.createdAt
                  : undefined;
              const isCurrentUser = message.senderId === currentUserId;
              return (
                <li
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[75%] ${isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-background text-foreground border-border rounded-bl-md border'}`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <time
                      dateTime={createdAt}
                      className={`mt-1 block text-right text-[10px] ${isCurrentUser ? 'text-primary-foreground/70' : 'text-foreground-muted'}`}
                    >
                      {formatTime(createdAt, locale)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-border border-t p-3 sm:p-4">
        {sendError ? (
          <p role="alert" className="text-danger mb-2 px-1 text-xs">
            {sendError}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={messages.sendMessagePlaceholder}
            aria-label={messages.sendMessagePlaceholder}
            maxLength={2000}
            className="border-border bg-background text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon="send"
            disabled={!draft.trim() || isSaving}
            aria-label={isSaving ? messages.sending : messages.send}
          >
            <span className="hidden sm:inline">
              {isSaving ? messages.sending : messages.send}
            </span>
          </Button>
        </form>
      </div>
    </section>
  );
}

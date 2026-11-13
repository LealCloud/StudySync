'use client';

import {
  MyConversationsDocument,
  StartConversationDocument,
  type StartConversationMutation,
  type StartConversationMutationVariables,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { useRouter } from '@/i18n/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from 'urql';
import { useSearchParams } from 'next/navigation';
import { ChatWindow } from './ChatWindow';
import { ConversationList } from './ConversationList';

export interface MessagingMessages {
  title: string;
  description: string;
  emptyConversations: string;
  selectConversation: string;
  sendMessagePlaceholder: string;
  send: string;
  sending: string;
  backToList: string;
  errors: {
    INTERNAL_ERROR: string;
    FORBIDDEN: string;
    NOT_FOUND: string;
    VALIDATION_ERROR: string;
  };
}

interface MessagingClientProps {
  messages: MessagingMessages;
  currentUserId: string;
}

function errorMessage(code: unknown, messages: MessagingMessages): string {
  if (typeof code === 'string' && code in messages.errors) {
    return messages.errors[code as keyof MessagingMessages['errors']];
  }
  return messages.errors.INTERNAL_ERROR;
}

export function MessagingClient({
  messages,
  currentUserId,
}: MessagingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get('userId');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const lastStartedParticipant = useRef<string | null>(null);
  const [conversationResult, executeConversations] = useQuery({
    query: MyConversationsDocument,
    requestPolicy: 'cache-and-network',
  });

  // TODO(polling-visibility): mismo tratamiento que en `ChatWindow`.
  // Ver `TODO(polling-visibility)` del plan (Fase 5).
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void executeConversations({ requestPolicy: 'network-only' });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [executeConversations]);

  const parseStartVariables = useCallback(
    (id: string): StartConversationMutationVariables => ({ participantId: id }),
    [],
  );
  const onStarted = useCallback(
    async (data: StartConversationMutation) => {
      setSelectedConversationId(data.startConversation.id);
      router.replace('/messages');
      await executeConversations({ requestPolicy: 'network-only' });
    },
    [executeConversations, router],
  );
  const mapStartError = useCallback(
    (code: string) => errorMessage(code, messages),
    [messages],
  );
  const { mutate: startConversation, errorCode: startError } =
    useSectionMutation<
      StartConversationMutation,
      StartConversationMutationVariables,
      string
    >({
      document: StartConversationDocument,
      parseVariables: parseStartVariables,
      mapError: mapStartError,
      onSuccess: onStarted,
    });

  useEffect(() => {
    if (
      !participantId ||
      selectedConversationId ||
      lastStartedParticipant.current === participantId
    ) {
      return;
    }
    lastStartedParticipant.current = participantId;
    void startConversation(participantId);
  }, [participantId, selectedConversationId, startConversation]);

  const conversations = conversationResult.data?.myConversations ?? [];
  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );
  const queryError = conversationResult.error
    ? errorMessage(
        conversationResult.error.graphQLErrors[0]?.extensions?.code,
        messages,
      )
    : null;

  return (
    <>
      {startError ? (
        <p role="alert" className="text-danger mb-4 text-sm">
          {startError}
        </p>
      ) : null}
      {queryError ? (
        <p role="alert" className="text-danger mb-4 text-sm">
          {queryError}
        </p>
      ) : null}

      <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className={selectedConversationId ? 'hidden lg:block' : 'block'}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            currentUserId={currentUserId}
            onSelect={setSelectedConversationId}
            messages={messages}
            isLoading={conversationResult.fetching && !conversationResult.data}
          />
        </div>

        <div
          className={
            selectedConversationId
              ? 'flex min-h-[70vh] min-w-0'
              : 'hidden min-h-[70vh] min-w-0 lg:flex'
          }
        >
          {conversationResult.fetching && !conversationResult.data ? (
            <div
              aria-busy="true"
              className="border-border bg-surface flex w-full items-center justify-center rounded-3xl border p-8"
            >
              <div className="w-full space-y-3" aria-hidden="true">
                <div className="bg-surface-hover h-10 w-2/3 animate-pulse rounded-2xl" />
                <div className="bg-surface-hover ml-auto h-10 w-1/2 animate-pulse rounded-2xl" />
                <div className="bg-surface-hover h-10 w-3/5 animate-pulse rounded-2xl" />
              </div>
            </div>
          ) : selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={currentUserId}
              messages={messages}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="border-border bg-surface text-foreground-muted hidden w-full items-center justify-center rounded-3xl border p-8 text-center text-sm lg:flex">
              {messages.selectConversation}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

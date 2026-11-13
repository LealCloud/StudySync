'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import type { MyConversationsQuery } from '@/graphql/generated/graphql';
import type { MessagingMessages } from './MessagingClient';

export type ConversationRecord =
  MyConversationsQuery['myConversations'][number];

interface ConversationListProps {
  conversations: ConversationRecord[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  messages: Pick<
    MessagingMessages,
    'emptyConversations' | 'selectConversation'
  >;
  isLoading: boolean;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toLocaleUpperCase();
}

function formatTimestamp(value: unknown, locale: string): string {
  if (typeof value !== 'string') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  messages,
  isLoading,
}: ConversationListProps) {
  const locale = useLocale();

  return (
    <section
      aria-label={messages.selectConversation}
      className="border-border bg-surface h-full min-h-[70vh] overflow-hidden rounded-3xl border"
    >
      {isLoading ? (
        <div className="space-y-3 p-4" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="bg-surface-hover h-16 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <p role="status" className="text-foreground-muted p-6 text-sm">
          {messages.emptyConversations}
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {conversations.map((conversation) => {
            const other = conversation.participants.find(
              (participant) => participant.user.id !== currentUserId,
            )?.user;
            const name = other?.name ?? '';
            const selected = conversation.id === selectedId;

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(conversation.id)}
                  className={`focus-visible:ring-primary flex w-full items-center gap-3 p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${selected ? 'bg-primary/10' : 'hover:bg-surface-hover'}`}
                >
                  <span className="bg-primary/10 text-primary relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold">
                    {other?.image ? (
                      <Image
                        src={other.image}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized
                        className="size-full object-cover"
                      />
                    ) : (
                      initials(name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-foreground truncate text-sm font-semibold">
                        {name}
                      </span>
                      <span className="text-foreground-muted shrink-0 text-[11px]">
                        {formatTimestamp(conversation.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-foreground-muted line-clamp-1 text-xs">
                        {conversation.lastMessage?.content ?? ''}
                      </span>
                      {conversation.unreadCount > 0 ? (
                        <span className="bg-danger text-danger-foreground inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

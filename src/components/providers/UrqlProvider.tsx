'use client';

import { createClient, fetchExchange, gql } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
  MyConversationsDocument,
  MyPaymentMethodsDocument,
  SidebarDataDocument,
} from '@/graphql/generated/graphql';
import { useMemo, type ReactNode } from 'react';
import { Provider } from 'urql';

export function UrqlProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      createClient({
        url: '/api/graphql',
        exchanges: [
          cacheExchange({
            keys: {
              // Entidades con `id` propio
              User: (data) => data.id as string,
              PublicProfile: (data) => data.id as string,
              UserSubscription: (data) => data.id as string,
              Certificate: (data) => data.id as string,
              PaymentMethod: (data) => data.id as string,
              Invoice: (data) => data.id as string,
              Conversation: (data) => data.id as string,
              ConversationParticipant: (data) => data.id as string,
              Message: (data) => data.id as string,

              // `CourseEnrollment` no tiene `id` propio; su clave natural
              // es `courseId` (contrato §5.7.1 / plan §5.7.9).
              CourseEnrollment: (data) => data.courseId as string,

              // Singletons "me"
              Account: () => 'me',
              PersonalData: () => 'me',
              PrivacySettings: () => 'me',
              SecuritySettings: () => 'me',
              Preferences: () => 'me',

              // ← NUEVO: subtipos embebidos sin `id`.
              // Al devolver `null` explícitamente, graphcache deja de intentar normalizarlos
              // y los embebe directamente en el padre. Es la solución oficial (ver doc 15).
              Profile: () => null,
              Bio: () => null,
              NotificationPreferences: () => null,
              AccessibilityPreferences: () => null,
              SecurityOperationResult: () => null,
              TwoFactorSetup: () => null,
            },
            updates: {
              Mutation: {
                updatePersonalData: (result, _args, cache) => {
                  const data = result.updatePersonalData as
                    { firstName?: string; lastName?: string } | undefined;
                  if (!data) return;

                  // `me` ya está cacheada: el dashboard monta `SidebarData` en el
                  // layout y esa query pide `me { id, name, email, image, role }`.
                  const meQuery = cache.readQuery({
                    query: SidebarDataDocument,
                  });
                  const userId = meQuery?.me?.id;
                  if (!userId) return;

                  const entityId = cache.keyOfEntity({
                    __typename: 'User',
                    id: userId,
                  });
                  if (!entityId) return;

                  const current = cache.readFragment(
                    gql`
                      fragment _ on User {
                        name
                      }
                    `,
                    entityId,
                  ) as { name?: string } | null;

                  const firstName = data.firstName ?? '';
                  const lastName = data.lastName ?? '';
                  const nextName = `${firstName} ${lastName}`.trim();
                  if (!nextName) return;
                  if (current?.name === nextName) return;

                  cache.writeFragment(
                    gql`
                      fragment _ on User {
                        name
                      }
                    `,
                    { __typename: 'User', id: userId, name: nextName },
                  );
                },

                /**
                 * `removePaymentMethod` devuelve `Boolean!`, no una entidad.
                 * Sin este `update` explícito, graphcache no puede saber
                 * que el método de pago eliminado ya no existe en el
                 * backend, y `myPaymentMethods` seguiría mostrándolo
                 * hasta un refetch.
                 *
                 * Estrategia (plan §8.2.23): al éxito (`true`), quitar
                 * el `PaymentMethod` cuyo `id` coincide con
                 * `args.paymentMethodId` de la lista cacheada.
                 *
                 * `myPaymentMethods` no recibe argumentos en el contrato
                 * §7, así que una sola llamada a `cache.updateQuery`
                 * cubre todas las variantes posibles (hoy: una sola).
                 * Si en el futuro se le añaden filtros o paginación,
                 * este `update` debe pasar a iterar sobre
                 * `cache.inspectFields('Query')` filtrando por
                 * `fieldName === 'myPaymentMethods'`.
                 */
                removePaymentMethod: (result, args, cache) => {
                  if (result.removePaymentMethod !== true) return;

                  const paymentMethodId =
                    typeof args.paymentMethodId === 'string'
                      ? args.paymentMethodId
                      : null;
                  if (!paymentMethodId) return;

                  cache.updateQuery(
                    { query: MyPaymentMethodsDocument },
                    (data) => {
                      if (!data) return null;

                      return {
                        ...data,
                        myPaymentMethods: data.myPaymentMethods.filter(
                          (method) => method.id !== paymentMethodId,
                        ),
                      };
                    },
                  );
                },

                // The root conversation list is a connection, so explicitly
                // place the new message and move its conversation to the top.
                sendMessage: (result, _args, cache) => {
                  const message = result.sendMessage as
                    | {
                        id: string;
                        conversationId: string;
                        senderId: string;
                        content: string;
                        createdAt: string;
                      }
                    | undefined;
                  if (!message) return;

                  cache.updateQuery(
                    { query: MyConversationsDocument },
                    (data) => {
                      if (!data) return null;
                      const conversation = data.myConversations.find(
                        (item) => item.id === message.conversationId,
                      );
                      if (!conversation) return data;

                      return {
                        ...data,
                        myConversations: [
                          {
                            ...conversation,
                            // TODO(sendMessage-sender): si en el futuro
                            // `MyConversationsDocument` pide
                            // `lastMessage { sender { ... } }`, este objeto
                            // debe incluir el `sender` completo. Hoy solo
                            // selecciona id, conversationId, senderId,
                            // content y createdAt, así que el shape es
                            // suficiente.
                            lastMessage: {
                              id: message.id,
                              conversationId: message.conversationId,
                              senderId: message.senderId,
                              content: message.content,
                              createdAt: message.createdAt,
                            },
                            lastMessageAt: message.createdAt,
                          },
                          ...data.myConversations.filter(
                            (item) => item.id !== message.conversationId,
                          ),
                        ],
                      };
                    },
                  );
                },

                // `markConversationAsRead` devuelve `Conversation` completa.
                // Actualizamos `unreadCount` en `myConversations` para que
                // el badge y la lista reflejen el cambio sin esperar al
                // siguiente polling. Si en el futuro se añade otro campo
                // a la mutación, ampliar este `update`.
                markConversationAsRead: (result, _args, cache) => {
                  const conversation = result.markConversationAsRead as
                    { id: string; unreadCount: number } | undefined;
                  if (!conversation) return;

                  cache.updateQuery(
                    { query: MyConversationsDocument },
                    (data) => {
                      if (!data) return null;
                      return {
                        ...data,
                        myConversations: data.myConversations.map((item) =>
                          item.id === conversation.id
                            ? { ...item, unreadCount: conversation.unreadCount }
                            : item,
                        ),
                      };
                    },
                  );
                },
              },
            },
          }),
          fetchExchange,
        ],
        requestPolicy: 'cache-and-network',
      }),
    [],
  );

  return <Provider value={client}>{children}</Provider>;
}

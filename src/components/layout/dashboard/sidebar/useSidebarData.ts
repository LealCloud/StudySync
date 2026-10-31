'use client';

import {
  SidebarDataDocument,
  type AccountStatus,
} from '@/graphql/generated/graphql';
import type { SubscriptionType, UserRole } from '@/types/user';
import type { CombinedError } from '@urql/core';
import { useQuery } from 'urql';

export interface SidebarData {
  isLoading: boolean;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole | null;
  plan: SubscriptionType | null;
  accountStatus: AccountStatus | null;
  error: CombinedError | undefined;
}

export function useSidebarData(): SidebarData {
  const [result] = useQuery({ query: SidebarDataDocument });

  return {
    isLoading: result.fetching && !result.data,
    name: result.data?.me.name ?? null,
    email: result.data?.me.email ?? null,
    image: result.data?.me.image ?? null,
    role: result.data?.me.role ?? null,
    plan: result.data?.mySubscription?.plan ?? null,
    accountStatus: result.data?.myAccount.status ?? null,
    error: result.error,
  };
}

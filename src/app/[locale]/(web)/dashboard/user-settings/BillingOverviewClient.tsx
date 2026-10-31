'use client';

import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  MyInvoicesDocument,
  MyPaymentMethodsDocument,
  MySubscriptionDocument,
} from '@/graphql/generated/graphql';
import { useQuery } from 'urql';
import { InvoicesClient } from './InvoicesClient';
import { PaymentMethodsClient } from './PaymentMethodsClient';
import { SubscriptionClient } from './SubscriptionClient';

interface BillingOverviewMessages {
  subscription: import('./SubscriptionClient').SubscriptionMessages;
  paymentMethods: import('./PaymentMethodsClient').PaymentMethodsMessages;
  invoices: import('./InvoicesClient').InvoicesMessages;
  errors: { INTERNAL_ERROR: string };
}

interface BillingOverviewClientProps {
  messages: BillingOverviewMessages;
}

export function BillingOverviewClient({
  messages,
}: BillingOverviewClientProps) {
  const [subscriptionResult] = useQuery({
    query: MySubscriptionDocument,
    requestPolicy: 'cache-and-network',
  });

  const [paymentMethodsResult] = useQuery({
    query: MyPaymentMethodsDocument,
    requestPolicy: 'cache-and-network',
  });

  const [invoicesResult] = useQuery({
    query: MyInvoicesDocument,
    requestPolicy: 'cache-and-network',
  });

  const anyFetching =
    (subscriptionResult.fetching && !subscriptionResult.data) ||
    (paymentMethodsResult.fetching && !paymentMethodsResult.data) ||
    (invoicesResult.fetching && !invoicesResult.data);

  if (anyFetching) {
    return <SettingsSkeleton rows={5} />;
  }

  const forbidden =
    subscriptionResult.error?.graphQLErrors.some(
      (error) => error.extensions?.code === 'FORBIDDEN',
    ) ||
    paymentMethodsResult.error?.graphQLErrors.some(
      (error) => error.extensions?.code === 'FORBIDDEN',
    ) ||
    invoicesResult.error?.graphQLErrors.some(
      (error) => error.extensions?.code === 'FORBIDDEN',
    );

  if (forbidden) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  const hasAnyError =
    (!subscriptionResult.data && subscriptionResult.error) ||
    (!paymentMethodsResult.data && paymentMethodsResult.error) ||
    (!invoicesResult.data && invoicesResult.error);

  if (hasAnyError) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <SubscriptionClient
        messages={messages.subscription}
        subscription={subscriptionResult.data?.mySubscription ?? null}
      />

      <PaymentMethodsClient
        messages={messages.paymentMethods}
        paymentMethods={paymentMethodsResult.data?.myPaymentMethods ?? []}
      />

      <InvoicesClient
        messages={messages.invoices}
        invoices={invoicesResult.data?.myInvoices ?? []}
      />
    </div>
  );
}

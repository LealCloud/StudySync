'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CancelSubscriptionDocument,
  ChangeSubscriptionPlanDocument,
  type CancelSubscriptionMutation,
  type CancelSubscriptionMutationVariables,
  type ChangeSubscriptionPlanMutation,
  type ChangeSubscriptionPlanMutationVariables,
  type MySubscriptionQuery,
  type SubscriptionPlan,
} from '@/graphql/generated/graphql';
import { useSectionMutation } from '@/hooks/useSectionMutation';
import { useLocale } from 'next-intl';
import { useCallback, useState } from 'react';

type SubscriptionRecord = NonNullable<MySubscriptionQuery['mySubscription']>;

export interface SubscriptionMessages {
  title: string;
  description: string;
  empty: string;
  planLabels: {
    free: string;
    premium: string;
    enterprise: string;
  };
  statusLabels: {
    trialing: string;
    active: string;
    past_due: string;
    canceled: string;
    expired: string;
  };
  fields: {
    currentPlan: string;
    status: string;
    startedAt: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: string;
    pastDueWarning: string;
    trialingNotice: string;
  };
  actions: {
    changePlan: string;
    changingPlan: string;
    cancelSubscription: string;
    cancellingSubscription: string;
    planSelectLabel: string;
  };
  confirmChange: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
  confirmCancel: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
  successChange: string;
  successCancel: string;
  errors: {
    CONFLICT: string;
    PAYMENT_METHOD_REQUIRED: string;
    FORBIDDEN: string;
    VALIDATION_ERROR: string;
    INTERNAL_ERROR: string;
  };
}

interface SubscriptionClientProps {
  messages: SubscriptionMessages;
  subscription: SubscriptionRecord | null;
}

type DialogState = 'change' | 'cancel' | null;

/**
 * Devuelve la lista de planes que el usuario puede elegir desde el
 * `<select>`. Excluye `enterprise` (no gestionable por API, contrato §6)
 * y el plan actual.
 */
function getAvailablePlans(current: SubscriptionPlan): SubscriptionPlan[] {
  const all: SubscriptionPlan[] = ['free', 'premium'];
  return all.filter((plan) => plan !== current);
}

function formatDate(value: unknown, locale: string): string {
  if (typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'long',
  }).format(date);
}

export function SubscriptionClient({
  messages,
  subscription,
}: SubscriptionClientProps) {
  const locale = useLocale();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mapError = useCallback(
    (code: string): string | null => {
      switch (code) {
        case 'CONFLICT':
          return messages.errors.CONFLICT;
        case 'PAYMENT_METHOD_REQUIRED':
          return messages.errors.PAYMENT_METHOD_REQUIRED;
        case 'FORBIDDEN':
          return messages.errors.FORBIDDEN;
        case 'VALIDATION_ERROR':
          return messages.errors.VALIDATION_ERROR;
        case 'INTERNAL_ERROR':
          return messages.errors.INTERNAL_ERROR;
        default:
          return null;
      }
    },
    [messages.errors],
  );

  /* ------------------------------------------------------------
   * changeSubscriptionPlan
   * ------------------------------------------------------------ */
  const {
    mutate: changePlan,
    isSaving: isChangingPlan,
    errorCode: changePlanError,
  } = useSectionMutation<
    ChangeSubscriptionPlanMutation,
    ChangeSubscriptionPlanMutationVariables,
    SubscriptionPlan
  >({
    document: ChangeSubscriptionPlanDocument,
    parseVariables: (plan) => ({ plan }),
    mapError,
    onSuccess: () => {
      setDialog(null);
      setPendingPlan(null);
      setSuccess(messages.successChange);
    },
  });

  /* ------------------------------------------------------------
   * cancelSubscription
   * ------------------------------------------------------------ */
  const {
    mutate: cancelSubscription,
    isSaving: isCancelling,
    errorCode: cancelError,
  } = useSectionMutation<
    CancelSubscriptionMutation,
    CancelSubscriptionMutationVariables,
    void
  >({
    document: CancelSubscriptionDocument,
    parseVariables: () => ({}),
    mapError,
    onSuccess: () => {
      setDialog(null);
      setSuccess(messages.successCancel);
    },
  });

  const handleConfirm = async () => {
    setSuccess(null);
    if (dialog === 'change' && pendingPlan) {
      await changePlan(pendingPlan);
    } else if (dialog === 'cancel') {
      await cancelSubscription();
    }
  };

  const handleCloseDialog = () => {
    if (isChangingPlan || isCancelling) return;
    setDialog(null);
    setPendingPlan(null);
  };

  const isMutating = isChangingPlan || isCancelling;
  const activeErrorCode =
    dialog === 'change'
      ? changePlanError
      : dialog === 'cancel'
        ? cancelError
        : null;

  /* ------------------------------------------------------------
   * Estado vacío
   * ------------------------------------------------------------ */
  if (!subscription) {
    return (
      <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
        <header className="mb-4">
          <h3 className="text-foreground text-sm font-semibold">
            {messages.title}
          </h3>
          <p className="text-foreground-muted mt-1 text-xs">
            {messages.description}
          </p>
        </header>
        <p role="status" className="text-foreground-muted text-sm">
          {messages.empty}
        </p>
      </section>
    );
  }

  /* ------------------------------------------------------------
   * Estado populated
   * ------------------------------------------------------------ */
  const showPeriodEnd =
    subscription.cancelAtPeriodEnd &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd !== undefined;

  const availablePlans = getAvailablePlans(subscription.plan);
  const isEnterprise = subscription.plan === 'enterprise';
  const canChangePlan =
    !isEnterprise &&
    subscription.status !== 'canceled' &&
    availablePlans.length > 0;
  const canCancel =
    subscription.status === 'active' && !subscription.cancelAtPeriodEnd;

  const defaultPlan = availablePlans[0] ?? null;

  return (
    <section className="border-border bg-background rounded-2xl border p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="text-foreground text-sm font-semibold">
          {messages.title}
        </h3>
        <p className="text-foreground-muted mt-1 text-xs">
          {messages.description}
        </p>
      </header>

      {activeErrorCode && (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger mb-4 rounded-xl border px-3 py-2 text-sm"
        >
          {activeErrorCode}
        </p>
      )}

      {success && (
        <p role="status" className="text-success mb-4 text-sm">
          {success}
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-surface rounded-xl border p-3">
          <dt className="text-foreground-muted text-xs font-semibold">
            {messages.fields.currentPlan}
          </dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {messages.planLabels[subscription.plan]}
          </dd>
        </div>

        <div className="border-border bg-surface rounded-xl border p-3">
          <dt className="text-foreground-muted text-xs font-semibold">
            {messages.fields.status}
          </dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {messages.statusLabels[subscription.status]}
          </dd>
        </div>

        <div className="border-border bg-surface rounded-xl border p-3">
          <dt className="text-foreground-muted text-xs font-semibold">
            {messages.fields.startedAt}
          </dt>
          <dd className="text-foreground mt-1 text-sm">
            {formatDate(subscription.startedAt, locale)}
          </dd>
        </div>

        {showPeriodEnd && (
          <div className="border-warning/30 bg-warning/10 rounded-xl border p-3">
            <dt className="text-foreground-muted text-xs font-semibold">
              {messages.fields.cancelAtPeriodEnd}
            </dt>
            <dd className="text-foreground mt-1 text-sm">
              {messages.fields.currentPeriodEnd.replace(
                '{date}',
                formatDate(subscription.currentPeriodEnd, locale),
              )}
            </dd>
          </div>
        )}
      </dl>

      {subscription.status === 'past_due' && (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger mt-3 rounded-xl border px-3 py-2 text-sm"
        >
          {messages.fields.pastDueWarning}
        </p>
      )}

      {subscription.status === 'trialing' && (
        <p className="border-info/30 bg-info/10 text-info mt-3 rounded-xl border px-3 py-2 text-sm">
          {messages.fields.trialingNotice}
        </p>
      )}

      {canChangePlan && defaultPlan && (
        <div className="border-border mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
          <label className="grid gap-1.5">
            <span className="text-foreground text-xs font-semibold">
              {messages.actions.planSelectLabel}
            </span>
            <select
              value={pendingPlan ?? defaultPlan}
              onChange={(event) =>
                setPendingPlan(event.target.value as SubscriptionPlan)
              }
              disabled={isMutating}
              className="border-border bg-surface text-foreground focus:border-border-focus rounded-xl border px-3 py-2 text-sm outline-none"
            >
              {availablePlans.map((plan) => (
                <option key={plan} value={plan}>
                  {messages.planLabels[plan]}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setSuccess(null);
              setDialog('change');
            }}
            disabled={isMutating}
          >
            {isChangingPlan
              ? messages.actions.changingPlan
              : messages.actions.changePlan}
          </Button>
        </div>
      )}

      {canCancel && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSuccess(null);
              setDialog('cancel');
            }}
            disabled={isMutating}
            className="hover:bg-danger/10 hover:text-danger"
          >
            {isCancelling
              ? messages.actions.cancellingSubscription
              : messages.actions.cancelSubscription}
          </Button>
        </div>
      )}

      {/* Confirmar cambio de plan */}
      <ConfirmDialog
        open={dialog === 'change'}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
        title={messages.confirmChange.title}
        description={messages.confirmChange.description.replace(
          '{plan}',
          pendingPlan ? messages.planLabels[pendingPlan] : '',
        )}
        confirmLabel={
          isChangingPlan
            ? messages.actions.changingPlan
            : messages.confirmChange.confirm
        }
        cancelLabel={messages.confirmChange.cancel}
        isPending={isMutating}
      />

      {/* Confirmar cancelación de suscripción */}
      <ConfirmDialog
        open={dialog === 'cancel'}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
        title={messages.confirmCancel.title}
        description={messages.confirmCancel.description}
        confirmLabel={
          isCancelling
            ? messages.actions.cancellingSubscription
            : messages.confirmCancel.confirm
        }
        cancelLabel={messages.confirmCancel.cancel}
        destructive
        isPending={isMutating}
      />
    </section>
  );
}

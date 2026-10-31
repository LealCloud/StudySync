'use client';

import type {
  InvoiceStatus,
  MyInvoicesQuery,
} from '@/graphql/generated/graphql';
import { useLocale } from 'next-intl';

type InvoiceRecord = MyInvoicesQuery['myInvoices'][number];

export interface InvoicesMessages {
  title: string;
  description: string;
  empty: string;
  fields: {
    issuedAt: string;
    amount: string;
  };
  statusLabels: Record<InvoiceStatus, string>;
  downloadLabel: string;
  errors: {
    INTERNAL_ERROR: string;
  };
}

interface InvoicesClientProps {
  messages: InvoicesMessages;
  invoices: InvoiceRecord[];
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: 'border-border bg-surface text-foreground-muted',
  open: 'border-info/20 bg-info/10 text-info',
  paid: 'border-success/20 bg-success/10 text-success',
  void: 'border-border bg-surface text-foreground-muted',
  uncollectible: 'border-danger/20 bg-danger/10 text-danger',
};

function formatDate(value: unknown, locale: string): string {
  if (typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
  }).format(date);
}

// TODO(amount-units): el contrato §7 define `amount` como entero en la
// unidad menor de la moneda. Para COP (100 centavos = 1 peso) dividir
// entre 100 es correcto, pero hay monedas sin decimales (JPY, KRW) donde
// `amount` ya está en unidades. Cuando el backend exponga la moneda
// exacta o cuando aparezca una moneda sin decimales, este cálculo debe
// resolverse desde un helper por moneda.
function formatAmount(
  amount: number,
  currency: string,
  locale: string,
): string {
  const value = amount / 100;
  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function InvoicesClient({ messages, invoices }: InvoicesClientProps) {
  const locale = useLocale();

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

      {invoices.length === 0 ? (
        <p role="status" className="text-foreground-muted text-sm">
          {messages.empty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {invoice.number}
                </p>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  {messages.fields.issuedAt.replace(
                    '{date}',
                    formatDate(invoice.issuedAt, locale),
                  )}
                  {' · '}
                  {formatAmount(invoice.amount, invoice.currency, locale)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[invoice.status]}`}
                >
                  {messages.statusLabels[invoice.status]}
                </span>

                {invoice.downloadUrl && (
                  <a
                    href={invoice.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border bg-background text-foreground hover:bg-surface-hover focus-visible:ring-border-focus rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {messages.downloadLabel}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

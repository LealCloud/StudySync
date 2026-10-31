'use client';

import { AppIcon } from '@/lib/iconMap';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import {
  MyCertificatesDocument,
  type MyCertificatesQuery,
} from '@/graphql/generated/graphql';
import { useLocale } from 'next-intl';
import { useQuery } from 'urql';

type CertificateRecord = MyCertificatesQuery['myCertificates'][number];

interface CertificatesMessages {
  empty: string;
  downloadLabel: string;
  issuedAt: string;
  certificateNumber: string;
  errors: {
    FORBIDDEN: string;
    INTERNAL_ERROR: string;
  };
}

interface CertificatesClientProps {
  messages: CertificatesMessages;
}

function formatDate(value: unknown, locale: string): string {
  if (typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  return new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium' }).format(
    date,
  );
}

export function CertificatesClient({ messages }: CertificatesClientProps) {
  const locale = useLocale();

  const [queryResult] = useQuery({
    query: MyCertificatesDocument,
    requestPolicy: 'cache-and-network',
  });

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={2} />;
  }

  const forbidden = queryResult.error?.graphQLErrors.some(
    (error) => error.extensions?.code === 'FORBIDDEN',
  );

  if (forbidden) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.FORBIDDEN}
      </p>
    );
  }

  if (!queryResult.data && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!queryResult.data) return null;

  const certificates = queryResult.data.myCertificates;

  if (certificates.length === 0) {
    return (
      <p role="status" className="text-foreground-muted text-sm">
        {messages.empty}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {certificates.map((certificate) => (
        <CertificateItem
          key={certificate.id}
          certificate={certificate}
          messages={messages}
          locale={locale}
        />
      ))}
    </ul>
  );
}

interface CertificateItemProps {
  certificate: CertificateRecord;
  messages: CertificatesMessages;
  locale: string;
}

function CertificateItem({
  certificate,
  messages,
  locale,
}: CertificateItemProps) {
  return (
    <li className="border-border bg-background flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 sm:p-5">
      <div className="min-w-0">
        <h3 className="text-foreground text-sm font-semibold">
          {certificate.courseTitle}
        </h3>
        <p className="text-foreground-muted mt-1 text-xs">
          {messages.certificateNumber.replace(
            '{number}',
            certificate.certificateNumber,
          )}
        </p>
        <p className="text-foreground-subtle mt-0.5 text-xs">
          {messages.issuedAt.replace(
            '{date}',
            formatDate(certificate.issuedAt, locale),
          )}
        </p>
      </div>

      <a
        href={certificate.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-surface text-foreground hover:bg-surface-hover focus-visible:ring-border-focus inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <AppIcon category="ui" name="upload" className="size-3.5 rotate-180" />
        {messages.downloadLabel}
      </a>
    </li>
  );
}

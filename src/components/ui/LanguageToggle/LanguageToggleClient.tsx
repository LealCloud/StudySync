'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/utilities/cn';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

type Locale = (typeof routing.locales)[number];

/* ==================================================== 
Banderas (SVG en línea, recortadas en círculo) 
==================================================== */

function FlagES() {
  return (
    <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
      <rect width="24" height="24" fill="#c60b1e" />
      <rect y="6" width="24" height="12" fill="#ffc400" />
    </svg>
  );
}

function FlagEN() {
  const stripeHeight = 24 / 7;
  return (
    <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
      <rect width="24" height="24" fill="#ffffff" />
      {[0, 2, 4, 6].map((i) => (
        <rect
          key={i}
          y={i * stripeHeight}
          width="24"
          height={stripeHeight}
          fill="#b22234"
        />
      ))}
      <rect width="11" height={stripeHeight * 4} fill="#3c3b6e" />
    </svg>
  );
}

const FLAGS: Record<Locale, () => React.JSX.Element> = {
  es: FlagES,
  en: FlagEN,
};

/* ==================================================== 
Toggle 
==================================================== */

interface LanguageToggleClientProps {
  className?: string;
  switchToSpanish: string;
  switchToEnglish: string;
}

export default function LanguageToggleClient({
  className,
  switchToSpanish,
  switchToEnglish,
}: LanguageToggleClientProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale: Locale = locale === 'es' ? 'en' : 'es';
  const CurrentFlag = FLAGS[locale] ?? FlagES;
  const label = nextLocale === 'es' ? switchToSpanish : switchToEnglish;

  const handleToggle = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={label}
      title={label}
      className={cn(
        'border-border bg-surface grid size-10 shrink-0 place-items-center rounded-full border',
        'transition-[background-color,border-color,transform] duration-200 active:scale-95',
        'hover:bg-surface-hover hover:border-border-focus/40',
        'focus-visible:ring-border-focus focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        'disabled:cursor-wait disabled:opacity-70',
        className,
      )}
    >
      <span className="block size-6 overflow-hidden rounded-full">
        <CurrentFlag />
      </span>
    </button>
  );
}

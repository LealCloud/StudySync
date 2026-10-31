import { Button } from '@/components/ui/Button';
import { IconMap } from '@/lib/iconMap';
import { getTranslations } from 'next-intl/server';

export default async function HomeCTA() {
  const { sparkles: Sparkles } = IconMap.ui;
  const t = await getTranslations('home.cta');

  return (
    <section
      id="contacto"
      className="border-accent bg-surface relative mx-auto w-[calc(100%-10vw)] scroll-mt-22 overflow-hidden rounded-3xl border px-[7%] py-20 text-center shadow-xl max-[720px]:w-[calc(100%-28px)] max-[720px]:px-5 max-[720px]:py-16.25"
    >
      <div
        className="bg-accent/20 pointer-events-none absolute -top-77.5 left-1/2 size-125 -translate-x-1/2 rounded-full blur-[20px]"
        aria-hidden="true"
      />

      <div className="relative z-2 mx-auto max-w-187.5">
        <span className="border-accent/25 bg-accent/10 text-accent mx-auto inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.75 text-xs font-extrabold tracking-[0.09em] uppercase">
          <Sparkles size={15} aria-hidden="true" />
          {t('eyebrow')}
        </span>

        <h2 className="text-foreground mt-4.75 text-[clamp(2.4rem,4vw,4.2rem)] leading-[1.05] font-bold tracking-[-0.06em]">
          {t('title')}
        </h2>

        <p className="text-foreground-muted mx-auto mt-4.75 max-w-155 text-sm leading-[1.7]">
          {t('description')}
        </p>

        <div className="mt-7.25 flex flex-wrap justify-center gap-3 max-[520px]:flex-col">
          <Button
            href="/register"
            variant="primary"
            icon="arrowRight"
            iconPosition="right"
          >
            {t('primary')}
          </Button>

          <Button href="/login" variant="ghost">
            {t('secondary')}
          </Button>
        </div>
      </div>
    </section>
  );
}

import { IconMap } from '@/lib/iconMap';

import { getTranslations } from 'next-intl/server';

export default async function HomeBenefits() {
  const t = await getTranslations('home.benefits');

  const {
    zap: Zap,
    calendar: CalendarDays,
    clock: Clock3,
    bot: Bot,
    message: MessageCircle,
    shield: ShieldCheck,
  } = IconMap.ui;

  return (
    <section
      id="beneficios"
      className="mx-auto grid w-[calc(100%-10vw)] grid-cols-[minmax(0,1.3fr)_minmax(330px,0.7fr)] items-center gap-18.75 py-30 max-[1180px]:grid-cols-1 max-[720px]:w-[calc(100%-40px)] max-[720px]:py-21.25"
    >
      <div>
        <div className="max-w-170">
          <span className="border-accent/25 bg-accent/10 text-accent inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.75 text-xs font-extrabold tracking-[0.09em] uppercase">
            <Zap size={15} aria-hidden="true" />
            {t('eyebrow')}
          </span>
          <h2 className="text-foreground mt-4 text-[clamp(2.2rem,4vw,4rem)] leading-[1.06] font-bold tracking-[-0.055em]">
            {t('title')}
          </h2>
          <p className="text-foreground-muted mt-4 text-sm leading-[1.75]">
            {t('description')}
          </p>
        </div>
        <div className="mt-9.5 grid grid-cols-2 gap-3.25 max-[720px]:grid-cols-1">
          <article className="border-border bg-surface grid grid-cols-[43px_minmax(0,1fr)] gap-3 rounded-2xl border p-4.25">
            <span className="bg-accent/10 text-accent grid size-10.75 place-items-center rounded-xl">
              <CalendarDays size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t('items.academicOrganization.title')}
              </h3>
              <p className="text-foreground-muted mt-1.75 text-xs leading-[1.55]">
                {t('items.academicOrganization.description')}
              </p>
            </div>
          </article>
          <article className="border-border bg-surface grid grid-cols-[43px_minmax(0,1fr)] gap-3 rounded-2xl border p-4.25">
            <span className="bg-accent/10 text-accent grid size-10.75 place-items-center rounded-xl">
              <Clock3 size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t('items.pomodoro.title')}
              </h3>
              <p className="text-foreground-muted mt-1.75 text-xs leading-[1.55]">
                {t('items.pomodoro.description')}
              </p>
            </div>
          </article>
          <article className="border-border bg-surface grid grid-cols-[43px_minmax(0,1fr)] gap-3 rounded-2xl border p-4.25">
            <span className="bg-accent/10 text-accent grid size-10.75 place-items-center rounded-xl">
              <Bot size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t('items.aiCoach.title')}
              </h3>
              <p className="text-foreground-muted mt-1.75 text-xs leading-[1.55]">
                {t('items.aiCoach.description')}
              </p>
            </div>
          </article>
          <article className="border-border bg-surface grid grid-cols-[43px_minmax(0,1fr)] gap-3 rounded-2xl border p-4.25">
            <span className="bg-accent/10 text-accent grid size-10.75 place-items-center rounded-xl">
              <MessageCircle size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t('items.communication.title')}
              </h3>
              <p className="text-foreground-muted mt-1.75 text-xs leading-[1.55]">
                {t('items.communication.description')}
              </p>
            </div>
          </article>
        </div>
      </div>
      <div className="border-accent bg-surface relative overflow-hidden rounded-2xl border p-8.75 shadow-xl max-[1180px]:max-w-155 max-[720px]:p-6.25">
        <span className="border-accent/30 bg-accent/10 text-accent grid size-16.25 place-items-center rounded-2xl border">
          <ShieldCheck size={30} aria-hidden="true" />
        </span>
        <span className="text-accent mt-7 block text-xs font-extrabold tracking-[0.08em] uppercase">
          {t('platform.eyebrow')}
        </span>
        <h3 className="text-foreground mt-2.5 text-2xl leading-[1.2] font-bold tracking-[-0.045em]">
          {t('platform.title')}
        </h3>
        <p className="text-foreground-muted mt-3.75 text-sm leading-[1.7]">
          {t('platform.description')}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
          <article className="border-border bg-background rounded-xl border p-4">
            <strong className="text-foreground block text-2xl">24/7</strong>
            <span className="text-foreground-muted mt-1.25 block text-xs">
              {t('platform.availability')}
            </span>
          </article>
          <article className="border-border bg-background rounded-xl border p-4">
            <strong className="text-foreground block text-2xl">100%</strong>
            <span className="text-foreground-muted mt-1.25 block text-xs">
              {t('platform.privacy')}
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}

import { Button } from '@/components/ui/Button';
import { IconMap } from '@/lib/iconMap';
import { getTranslations } from 'next-intl/server';

export default async function HomeHero() {
  const t = await getTranslations('home.hero');

  const {
    bot: Bot,
    checkCircle: CheckCircle2,
    clock: Clock3,
    graduationCap: GraduationCap,
    sparkles: Sparkles,
    target: Target,
    users: Users,
    video: Video,
    zap: Zap,
    arrowRight: ArrowRight,
  } = IconMap.ui;

  const stats = [
    {
      icon: Clock3,
      title: t('dashboardPreview.stats.timeStudied'),
      value: '24.5 h',
    },
    {
      icon: Target,
      title: t('dashboardPreview.stats.weeklyGoal'),
      value: '82%',
    },
    {
      icon: Users,
      title: t('dashboardPreview.stats.activeRooms'),
      value: '12',
    },
  ];

  const chartHeights = [35, 62, 48, 78, 91, 69, 84];

  const benefits = [
    t('benefits.noCreditCard'),
    t('benefits.instantAccess'),
    t('benefits.forEveryone'),
  ];

  const dashboardItems = [1, 2, 3, 4, 5];

  const trustedItems = [
    t('trusted.items.focus'),
    t('trusted.items.collaboration'),
    t('trusted.items.organization'),
    t('trusted.items.progress'),
  ];

  return (
    <section className="bg-background relative grid min-h-[calc(100vh-5rem)] content-center overflow-hidden px-[5vw] py-17.5 max-[1180px]:py-15 max-[720px]:min-h-[calc(100vh-5rem)] max-[720px]:px-5 max-[720px]:py-12.5">
      {/* Glow superior derecho */}
      <div
        aria-hidden="true"
        className="bg-accent/10 pointer-events-none absolute top-[7%] right-[2%] h-117.5 w-117.5 rounded-full blur-[20px] max-[720px]:top-[4%] max-[720px]:-right-45 max-[720px]:h-87.5 max-[720px]:w-87.5"
      />

      {/* Glow inferior izquierdo */}
      <div
        aria-hidden="true"
        className="bg-primary/10 pointer-events-none absolute bottom-[2%] -left-40 h-87.5 w-87.5 rounded-full blur-[20px] max-[720px]:-bottom-25 max-[720px]:-left-37.5"
      />

      {/* Grid de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(color-mix(in_oklch,var(--accent)_3%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--accent)_3%,transparent)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent_75%)] bg-size-[42px_42px]"
      />

      {/* Contenido principal */}
      <div className="relative z-10 mx-auto grid w-full max-w-355 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-[clamp(45px,5vw,90px)] max-[1180px]:grid-cols-1">
        {/* HERO CONTENT */}
        <div className="max-w-165 max-[1180px]:mx-auto max-[1180px]:max-w-200 max-[1180px]:text-center">
          {/* Eyebrow */}
          <span className="border-accent/25 bg-accent/10 text-accent inline-flex w-fit items-center gap-2 rounded-full border px-2.75 py-1.75 text-xs font-extrabold tracking-[0.09em] uppercase max-[1180px]:mx-auto">
            <Sparkles size={15} />
            {t('eyebrow')}
          </span>

          <h1 className="text-foreground mt-5.25 max-w-190 font-serif text-[clamp(3.5rem,5.5vw,6rem)] leading-[0.94] font-bold tracking-[-0.075em] max-[1180px]:mx-auto max-[720px]:text-[clamp(2.8rem,13vw,4.2rem)]">
            {t('title.line1')}
            <span className="from-info to-primary block bg-linear-to-r bg-clip-text text-transparent">
              {t('title.line2')}
            </span>
          </h1>

          <p className="text-foreground-muted mt-6.25 max-w-155 text-sm leading-[1.8] max-[1180px]:mx-auto max-[520px]:text-xs max-[520px]:leading-[1.7]">
            {t('description')}
          </p>

          <div className="mt-7 flex flex-wrap gap-3 max-[1180px]:justify-center max-[520px]:flex-col">
            <Button
              href="/register"
              variant="secondary"
              size="lg"
              icon="arrowRight"
              iconPosition="right"
            >
              {t('cta.primary')}
            </Button>

            <Button href="/login" variant="ghost" size="lg" icon="play">
              {t('cta.secondary')}
            </Button>
          </div>

          <ul className="mt-6.75 flex flex-wrap gap-4.5 max-[1180px]:justify-center max-[520px]:flex-col max-[520px]:items-start">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="text-foreground-muted inline-flex items-center gap-1.75 text-xs"
              >
                <CheckCircle2 size={16} className="text-accent" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* DASHBOARD PREVIEW */}
        <div className="border-border bg-surface relative min-h-130 transform-[perspective(1300px)_rotateY(-4deg)_rotateX(1deg)] overflow-visible rounded-3xl border shadow-xl max-[1180px]:mx-auto max-[1180px]:w-full max-[1180px]:max-w-200 max-[1180px]:transform-none max-[720px]:min-h-0 max-[720px]:rounded-2xl">
          {/* Header */}
          <div className="border-border flex min-h-12.5 items-center justify-between border-b px-4.25">
            <div className="flex gap-1.5">
              <span className="bg-border h-2 w-2 rounded-full" />
              <span className="bg-border h-2 w-2 rounded-full" />
              <span className="bg-border h-2 w-2 rounded-full" />
            </div>

            <span className="text-foreground-muted flex items-center gap-1.75 text-xs">
              <span className="bg-success h-1.75 w-1.75 rounded-full shadow-[0_0_9px_color-mix(in_oklch,var(--success)_55%,transparent)]" />
              {t('dashboardPreview.status')}
            </span>
          </div>

          {/* Dashboard body */}
          <div className="grid min-h-117 grid-cols-[65px_minmax(0,1fr)] max-[720px]:min-h-0 max-[720px]:grid-cols-1">
            {/* Sidebar */}
            <aside className="border-border bg-background/40 flex flex-col items-center gap-5 border-r px-0 py-4.5 max-[720px]:hidden">
              <div className="bg-primary text-primary-foreground mb-2 grid h-8.75 w-8.75 place-items-center rounded-xl">
                <GraduationCap size={19} />
              </div>

              {dashboardItems.map((item) => (
                <span
                  key={item}
                  className={`h-1.5 w-6 rounded-full ${
                    item === 1
                      ? 'bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_55%,transparent)]'
                      : 'bg-secondary'
                  }`}
                />
              ))}
            </aside>

            {/* Dashboard content */}
            <div className="min-w-0 p-5.75 max-[720px]:p-4.25">
              {/* Heading */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <small className="text-foreground-muted block text-xs">
                    {t('dashboardPreview.welcome')}
                  </small>

                  <h2 className="text-foreground mt-1.25 block font-serif text-base">
                    {t('dashboardPreview.progressTitle')}
                  </h2>
                </div>

                <span className="border-accent/30 bg-primary text-primary-foreground grid h-9.25 w-9.25 shrink-0 place-items-center rounded-xl border text-xs font-extrabold">
                  {t('dashboardPreview.initials')}
                </span>
              </div>

              {/* Statistics */}
              <div className="mt-5.75 grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1">
                {stats.map((stat) => {
                  const StatIcon = stat.icon;

                  return (
                    <article
                      key={stat.title}
                      className="border-border bg-background/80 flex min-w-0 items-center gap-2.25 rounded-xl border p-3.25"
                    >
                      <span className="bg-accent/10 text-accent grid h-8.75 w-8.75 shrink-0 place-items-center rounded-xl">
                        <StatIcon size={18} />
                      </span>

                      <div className="min-w-0">
                        <small className="text-foreground-muted block truncate text-xs">
                          {stat.title}
                        </small>

                        <strong className="text-foreground mt-1 block text-sm">
                          {stat.value}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Lower content */}
              <div className="mt-3 grid grid-cols-[minmax(0,1.3fr)_minmax(190px,0.7fr)] gap-2.75 max-[900px]:grid-cols-1">
                {/* Progress */}
                <article
                  className="border-border bg-background/80 min-h-59.5 rounded-2xl border p-4 max-[720px]:min-h-55"
                  role="img"
                  aria-label={t('dashboardPreview.weeklyProgress.ariaLabel')}
                >
                  <div className="flex justify-between gap-3.75">
                    <h3 className="text-foreground-muted text-xs">
                      {t('dashboardPreview.weeklyProgress.title')}
                    </h3>

                    <strong className="text-foreground text-xs">
                      {t('dashboardPreview.weeklyProgress.value')}
                    </strong>
                  </div>

                  <div className="border-border mt-6 flex h-38.75 items-end justify-between gap-2 border-b px-1">
                    {chartHeights.map((height, index) => (
                      <span
                        key={`${height}-${index}`}
                        className="from-primary to-info w-[10%] rounded-t-[5px] bg-linear-to-t shadow-[0_0_14px_color-mix(in_oklch,var(--info)_18%,transparent)]"
                        style={{ height: `${height}%` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </article>

                {/* Próxima sesión */}
                <article className="border-border bg-background/80 flex min-h-59.5 flex-col rounded-2xl border p-4.25 max-[720px]:min-h-55">
                  <span className="bg-accent/10 text-accent grid h-10.5 w-10.5 place-items-center rounded-xl">
                    <Video size={20} />
                  </span>

                  <div className="mt-4.5">
                    <small className="text-foreground-muted block text-xs">
                      {t('dashboardPreview.nextSession.title')}
                    </small>

                    <h3 className="text-foreground mt-1.25 block text-sm">
                      {t('dashboardPreview.nextSession.course')}
                    </h3>

                    <span className="text-foreground-muted mt-1.75 block text-xs">
                      {t('dashboardPreview.nextSession.time')}
                    </span>
                  </div>

                  <div className="mt-auto flex w-full justify-end">
                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                      className="text-foreground-muted"
                    />
                  </div>
                </article>
              </div>
            </div>
          </div>

          {/* Floating card izquierda */}
          <div className="border-accent/20 bg-surface absolute bottom-15.75 -left-9.5 z-20 flex items-center gap-2.5 rounded-xl border px-3.25 py-2.75 shadow-xl backdrop-blur-xl max-[720px]:hidden">
            <span className="bg-accent/10 text-accent grid h-8.5 w-8.5 place-items-center rounded-xl">
              <Zap size={17} />
            </span>

            <div>
              <small className="text-foreground-muted block text-xs">
                {t('dashboardPreview.streak.title')}
              </small>

              <strong className="text-foreground mt-0.75 block text-sm">
                {t('dashboardPreview.streak.value')}
              </strong>
            </div>
          </div>

          {/* Floating card derecha */}
          <div className="border-accent/20 bg-surface absolute top-23.5 -right-8.5 z-20 flex items-center gap-2.5 rounded-xl border px-3.25 py-2.75 shadow-xl backdrop-blur-xl max-[720px]:hidden">
            <span className="bg-accent/10 text-accent grid h-8.5 w-8.5 place-items-center rounded-xl">
              <Bot size={18} />
            </span>

            <div>
              <small className="text-foreground-muted block text-xs">
                {t('dashboardPreview.aiCoach.title')}
              </small>

              <strong className="text-foreground mt-0.75 block text-sm">
                {t('dashboardPreview.aiCoach.value')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* TRUSTED */}
      <div className="border-border relative z-10 mx-auto mt-11.25 flex w-full max-w-355 items-center justify-between gap-6.25 border-t pt-6.25 max-[720px]:flex-col max-[720px]:items-start">
        <span className="text-foreground-muted text-xs tracking-widest uppercase">
          {t('trusted.title')}
        </span>

        <ul className="flex flex-wrap justify-end gap-8.5 max-[720px]:justify-start max-[720px]:gap-4.5">
          {trustedItems.map((item) => (
            <li
              key={item}
              className="text-foreground-muted text-sm font-bold tracking-wider"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

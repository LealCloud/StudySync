import { Button } from '@/components/ui/Button';
import { IconMap } from '@/lib/iconMap';
import { getTranslations } from 'next-intl/server';

export default async function HomeStudyRooms() {
  const t = await getTranslations('home.studyRooms');

  const {
    video: Video,
    sparkles: Sparkles,
    checkCircle: CheckCircle2,
    users: Users,
    arrowRight: ArrowRight,
  } = IconMap.ui;

  const studyRooms = [
    {
      id: 1,
      title: t('rooms.react.title'),
      subject: t('rooms.react.subject'),
      members: 18,
      progress: 82,
      status: t('status.active'),
    },
    {
      id: 2,
      title: t('rooms.calculus.title'),
      subject: t('rooms.calculus.subject'),
      members: 12,
      progress: 64,
      status: t('status.active'),
    },
    {
      id: 3,
      title: t('rooms.databases.title'),
      subject: t('rooms.databases.subject'),
      members: 9,
      progress: 46,
      status: t('status.comingSoon'),
    },
  ];

  return (
    <section
      id="salas"
      className="border-border bg-surface mx-auto my-8 w-[calc(100%-10vw)] scroll-mt-22 rounded-3xl border px-[5%] py-20 shadow-xl max-[720px]:w-[calc(100%-40px)] max-[720px]:rounded-2xl max-[720px]:px-4 max-[720px]:py-12"
    >
      <div className="max-w-170">
        <span className="border-accent/25 bg-accent/10 text-accent inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.75 text-xs font-extrabold tracking-[0.09em] uppercase">
          <Video size={15} aria-hidden="true" />
          {t('eyebrow')}
        </span>
        <h2 className="text-foreground mt-4 text-[clamp(2.2rem,4vw,4rem)] leading-[1.06] font-bold tracking-[-0.055em] max-[720px]:text-[clamp(1.8rem,8vw,2.5rem)]">
          {t('title')}
        </h2>
        <p className="text-foreground-muted mt-4 text-sm leading-[1.75] max-[720px]:text-xs">
          {t('description')}
        </p>
      </div>
      <div className="mt-11 grid grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] items-stretch gap-4.5 max-[1180px]:grid-cols-1">
        {/* Grid de salas */}
        <div className="grid grid-cols-3 gap-3.25 max-[960px]:grid-cols-2 max-[720px]:grid-cols-1">
          {studyRooms.map((room) => {
            const isActive = room.status === t('status.active');
            return (
              <article
                key={room.id}
                className="border-border bg-background min-w-0 rounded-xl border p-5 max-[720px]:p-4"
              >
                <div className="flex items-center justify-between gap-2.75">
                  <div className="bg-accent/10 text-accent grid size-10.75 place-items-center rounded-xl max-[720px]:size-9">
                    <Video
                      size={21}
                      aria-hidden="true"
                      className="max-[720px]:size-4"
                    />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold ${
                      isActive
                        ? 'border-success/20 bg-success/10 text-success'
                        : 'border-warning/20 bg-warning/10 text-warning'
                    } max-[720px]:text-[10px]`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        isActive ? 'bg-success' : 'bg-warning'
                      }`}
                      aria-hidden="true"
                    />
                    {room.status}
                  </span>
                </div>
                <span className="text-accent mt-6 block text-xs font-bold tracking-[0.07em] uppercase max-[720px]:mt-4 max-[720px]:text-[10px]">
                  {room.subject}
                </span>
                <h3 className="text-foreground mt-1.75 text-sm font-semibold max-[720px]:text-xs">
                  {room.title}
                </h3>
                <div className="text-foreground-muted mt-7 flex justify-between gap-2.5 text-xs max-[720px]:mt-4 max-[720px]:text-[10px]">
                  <span>{t('sessionProgress')}</span>
                  <strong className="text-accent">{room.progress}%</strong>
                </div>
                <div className="bg-secondary mt-2.25 h-1.5 overflow-hidden rounded-full max-[720px]:mt-1.5">
                  <span
                    className="from-primary to-accent block h-full rounded-[inherit] bg-linear-to-r shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_35%,transparent)]"
                    style={{ width: `${room.progress}%` }}
                  />
                </div>
                <div className="border-border mt-5 flex items-center justify-between gap-3 border-t pt-3.75 max-[720px]:mt-3 max-[720px]:pt-2.5">
                  <span className="text-foreground-muted flex items-center gap-1.5 text-xs max-[720px]:text-[10px]">
                    <Users
                      size={16}
                      aria-hidden="true"
                      className="max-[720px]:size-3.5"
                    />
                    {room.members} {t('participants')}
                  </span>
                  <div
                    className="border-accent/20 bg-accent/10 text-accent grid size-8 place-items-center rounded-lg border max-[720px]:size-6"
                    aria-hidden="true"
                  >
                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                      className="max-[720px]:size-3.5"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {/* Aside */}
        <aside className="border-accent bg-background flex min-h-97.5 flex-col items-start rounded-xl border p-7 max-[720px]:min-h-0 max-[720px]:p-5">
          <span className="border-accent/25 bg-accent/10 text-accent inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.75 text-xs font-extrabold tracking-[0.09em] uppercase max-[720px]:text-[10px]">
            <Sparkles
              size={15}
              aria-hidden="true"
              className="max-[720px]:size-3"
            />
            {t('aside.eyebrow')}
          </span>
          <h3 className="text-foreground mt-5.5 text-2xl leading-[1.2] font-bold tracking-[-0.04em] max-[720px]:mt-4 max-[720px]:text-xl">
            {t('aside.title')}
          </h3>
          <p className="text-foreground-muted mt-3.5 text-sm leading-[1.7] max-[720px]:mt-2.5 max-[720px]:text-xs">
            {t('aside.description')}
          </p>
          <div className="mt-5.5 grid gap-3 max-[720px]:mt-4 max-[720px]:gap-2">
            <span className="text-foreground-muted flex items-center gap-2.25 text-sm max-[720px]:text-xs">
              <CheckCircle2
                size={18}
                className="text-accent shrink-0 max-[720px]:size-4"
                aria-hidden="true"
              />
              {t('aside.benefits.chat')}
            </span>
            <span className="text-foreground-muted flex items-center gap-2.25 text-sm max-[720px]:text-xs">
              <CheckCircle2
                size={18}
                className="text-accent shrink-0 max-[720px]:size-4"
                aria-hidden="true"
              />
              {t('aside.benefits.pomodoro')}
            </span>
            <span className="text-foreground-muted flex items-center gap-2.25 text-sm max-[720px]:text-xs">
              <CheckCircle2
                size={18}
                className="text-accent shrink-0 max-[720px]:size-4"
                aria-hidden="true"
              />
              {t('aside.benefits.resources')}
            </span>
          </div>
          <Button
            href="/register"
            variant="primary"
            fullWidth
            icon="arrowRight"
            iconPosition="right"
            className="mt-6 max-[720px]:mt-4"
          >
            {t('aside.cta')}
          </Button>
        </aside>
      </div>
    </section>
  );
}

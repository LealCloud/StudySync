import { IconMap } from '@/lib/iconMap';
import { getTranslations } from 'next-intl/server';

export default async function HomeFeatures() {
  const t = await getTranslations('home.features');

  const { target: Target, users: Users, brain: BrainCircuit } = IconMap.ui;

  const features = [
    {
      id: 1,
      title: t('items.focus.title'),
      description: t('items.focus.description'),
      icon: Target,
    },
    {
      id: 2,
      title: t('items.collaboration.title'),
      description: t('items.collaboration.description'),
      icon: Users,
    },
    {
      id: 3,
      title: t('items.progress.title'),
      description: t('items.progress.description'),
      icon: BrainCircuit,
    },
  ];

  return (
    <section className="mx-auto w-[calc(100%-10vw)] max-w-355 py-20 md:py-14">
      <header className="mx-auto max-w-170 text-center">
        <span className="border-accent/25 bg-accent/10 text-accent mx-auto inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold tracking-[0.09em] uppercase">
          <BrainCircuit size={15} aria-hidden="true" />
          {t('eyebrow')}
        </span>

        <h2 className="text-foreground mt-4 text-[clamp(2.2rem,4vw,4rem)] leading-[1.06] font-bold tracking-[-0.055em]">
          {t('title')}
        </h2>

        <p className="text-foreground-muted mx-auto mt-4 max-w-170 text-sm leading-[1.75]">
          {t('description')}
        </p>
      </header>

      <div className="mx-auto mt-12 grid max-w-170 grid-cols-1 gap-4 lg:max-w-none lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.id}
              className="group border-border bg-surface hover:border-accent-hover hover:bg-surface-hover relative min-h-61.25 overflow-hidden rounded-2xl border p-6.5 shadow-xl transition-all duration-200 hover:-translate-y-1 lg:min-h-72.5"
            >
              <span
                className="text-accent/15 absolute top-5 right-5 text-[2.4rem] leading-none font-black"
                aria-hidden="true"
              >
                0{feature.id}
              </span>

              <div className="border-accent/25 bg-accent/10 text-accent grid size-13.25 place-items-center rounded-xl border">
                <Icon size={24} aria-hidden="true" />
              </div>

              <h3 className="text-foreground mt-7 text-lg font-semibold">
                {feature.title}
              </h3>

              <p className="text-foreground-muted mt-3 text-xs leading-[1.7]">
                {feature.description}
              </p>

              <span
                className="from-accent to-accent/0 absolute right-6 bottom-6 left-6 h-0.5 rounded-full bg-linear-to-r"
                aria-hidden="true"
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

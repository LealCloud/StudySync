import { IconMap } from '@/lib/iconMap';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import LoginForm from './LoginForm';

// Componente para las tarjetas de beneficios (Server)
const BenefitCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <article className="group border-border bg-surface hover:border-primary-hover hover:bg-surface-hover flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-1">
    <div className="border-primary/30 bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl border">
      {icon}
    </div>
    <span>
      <strong className="text-foreground block text-sm">{title}</strong>
      <small className="text-foreground-muted mt-1 block text-xs leading-relaxed">
        {description}
      </small>
    </span>
  </article>
);

export default async function LoginPage() {
  const [t, forgotT, allMessages] = await Promise.all([
    getTranslations('auth.login'),
    getTranslations('auth.forgotPassword'),
    getMessages(),
  ]);

  const validation = allMessages.Validation as ValidationDict;
  const { shield: ShieldCheck, sparkles: Sparkles, users: Users } = IconMap.ui;

  const formMessages = {
    eyebrow: t('form.eyebrow'),
    title: t('form.title'),
    description: t('form.description'),
    fields: {
      email: {
        label: t('form.fields.email.label'),
        placeholder: t('form.fields.email.placeholder'),
      },
      password: {
        label: t('form.fields.password.label'),
        placeholder: t('form.fields.password.placeholder'),
        show: t('form.fields.password.show'),
        hide: t('form.fields.password.hide'),
      },
    },
    forgotPassword: t('form.forgotPassword'),
    actions: {
      submit: t('form.actions.submit'),
      submitting: t('form.actions.submitting'),
    },
    success: t('form.success'),
    errors: {
      invalidCredentials: t('form.errors.invalidCredentials'),
      unexpected: t('form.errors.unexpected'),
      rateLimited: t('form.errors.rateLimited'),
      unavailable: t('form.errors.unavailable'),
    },
    footer: {
      prompt: t('form.footer.prompt'),
      link: t('form.footer.link'),
    },
  };
  const forgotMessages = {
    title: forgotT('title'),
    description: forgotT('description'),
    label: forgotT('label'),
    placeholder: forgotT('placeholder'),
    legend: forgotT('legend'),
    successTitle: forgotT('successTitle'),
    success: forgotT('success'),
    close: forgotT('close'),
    submit: forgotT('submit'),
    submitting: forgotT('submitting'),
    back: forgotT('back'),
    unexpected: forgotT('unexpected'),
    errors: {
      rateLimited: forgotT('errors.rateLimited'),
      invalidData: forgotT('errors.invalidData'),
      serverError: forgotT('errors.serverError'),
      unavailable: forgotT('errors.unavailable'),
    },
  };

  return (
    <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
      {/* Sección de showcase - izquierda */}
      <section className="border-border bg-background relative flex flex-col items-center overflow-hidden border-r p-8">
        {/* Patrón de fondo sutil */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--accent)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent_82%)] bg-size-[42px_42px] opacity-10" />

        {/* Efectos de brillo (Glow) sincronizados */}
        <div className="bg-accent/10 pointer-events-none absolute -top-45 -right-30 h-102.5 w-102.5 rounded-full blur-2xl" />
        <div className="bg-primary/10 pointer-events-none absolute -bottom-37.5 -left-45 h-90 w-90 rounded-full blur-2xl" />

        {/* Contenido principal */}
        <div className="relative z-10 my-auto w-full max-w-xl">
          {/* Badge */}
          <span className="border-primary/25 bg-primary/10 text-primary inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wider uppercase">
            <Sparkles size={15} />
            {t('page.eyebrow')}
          </span>

          {/* Título principal */}
          <h1 className="text-foreground mt-6 mb-4 max-w-xl text-5xl font-extrabold tracking-tight lg:text-7xl">
            {t('page.title.before')}{' '}
            <span className="text-primary">{t('page.title.highlight')}</span>
          </h1>

          {/* Descripción */}
          <p className="text-foreground-muted max-w-lg text-lg leading-relaxed">
            {t('page.description')}
          </p>

          {/* Tarjetas */}
          <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
            <BenefitCard
              icon={<Users size={21} />}
              title={t('page.cards.rooms.title')}
              description={t('page.cards.rooms.description')}
            />
            <BenefitCard
              icon={<ShieldCheck size={21} />}
              title={t('page.cards.security.title')}
              description={t('page.cards.security.description')}
            />
          </div>
        </div>
      </section>

      {/* Sección del formulario - derecha */}
      <LoginForm
        messages={formMessages}
        forgotMessages={forgotMessages}
        validation={validation}
      />
    </div>
  );
}

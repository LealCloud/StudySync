import { IconMap } from '@/lib/iconMap';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import RegisterForm from './RegisterForm';

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

export default async function RegisterPage() {
  const [t, formT, allMessages] = await Promise.all([
    getTranslations('auth.register.page'),
    getTranslations('auth.register.form'),
    getMessages(),
  ]);
  const validation = allMessages.Validation as ValidationDict;
  const messages = {
    eyebrow: formT('eyebrow'),
    title: formT('title'),
    description: formT('description'),
    fields: {
      firstName: {
        label: formT('fields.firstName.label'),
        placeholder: formT('fields.firstName.placeholder'),
      },
      lastName: {
        label: formT('fields.lastName.label'),
        placeholder: formT('fields.lastName.placeholder'),
      },
      email: {
        label: formT('fields.email.label'),
        placeholder: formT('fields.email.placeholder'),
      },
      password: {
        label: formT('fields.password.label'),
        placeholder: formT('fields.password.placeholder'),
        show: formT('fields.password.show'),
        hide: formT('fields.password.hide'),
      },
      confirmPassword: {
        label: formT('fields.confirmPassword.label'),
        placeholder: formT('fields.confirmPassword.placeholder'),
      },
    },
    terms: formT('terms'),
    success: formT('success'),
    actions: {
      submit: formT('actions.submit'),
      submitting: formT('actions.submitting'),
    },
    errors: {
      rateLimited: formT('errors.rateLimited'),
      invalidData: formT('errors.invalidData'),
      serverError: formT('errors.serverError'),
      unavailable: formT('errors.unavailable'),
      emailTaken: formT('errors.emailTaken'),
    },
    footer: { prompt: formT('footer.prompt'), link: formT('footer.link') },
  };
  const { users: Users, shield: ShieldCheck, sparkles: Sparkles } = IconMap.ui;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
      {/* Sección de showcase - izquierda */}
      <section className="border-border relative flex flex-col items-center overflow-hidden border-r bg-background p-8">
        {/* Decoración de fondo simplificada */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--accent)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent_80%)] bg-size-[40px_40px] opacity-10" />

        {/* Glows decorativos */}
        <div className="bg-primary/10 pointer-events-none absolute -top-40 -right-24 size-96 rounded-full blur-3xl" />
        <div className="bg-primary/5 pointer-events-none absolute -bottom-32 -left-36 size-80 rounded-full blur-3xl" />

        {/* Contenido principal */}
        <div className="relative z-10 my-auto w-full max-w-xl">
          {/* Badge */}
          <span className="border-primary/25 bg-primary/10 text-primary inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wider uppercase">
            <Sparkles size={15} />
            {t('eyebrow')}
          </span>

          {/* Título principal */}
          <h1 className="text-foreground mt-6 mb-4 max-w-xl text-5xl font-extrabold tracking-tight lg:text-7xl">
            {t('title.before')}{' '}
            <span className="text-primary">{t('title.highlight')}</span>
          </h1>

          {/* Descripción */}
          <p className="text-foreground-muted max-w-lg text-lg leading-relaxed">
            {t('description')}
          </p>

          {/* Tarjetas */}
          <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
            <BenefitCard
              icon={<Users size={21} />}
              title={t('cards.community.title')}
              description={t('cards.community.description')}
            />
            <BenefitCard
              icon={<ShieldCheck size={21} />}
              title={t('cards.security.title')}
              description={t('cards.security.description')}
            />
          </div>
        </div>
      </section>

      {/* Sección del formulario - derecha */}
      <RegisterForm messages={messages} validation={validation} />
    </div>
  );
}

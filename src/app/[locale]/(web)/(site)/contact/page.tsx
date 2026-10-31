import { AppIcon, type UiIconName } from '@/lib/iconMap';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import { ContactForm } from './ContactForm';

/* ====================================================
   Canales de contacto
   ==================================================== */

interface ContactChannel {
  icon: UiIconName;
  title: string;
  description: string;
  href?: string;
}

// TODO: reemplazar estos datos de ejemplo por los canales reales de StudySync.

function getContactChannels(
  t: (key: string) => string,
): readonly ContactChannel[] {
  return [
    {
      icon: 'mail',
      title: t('page.channels.email.title'),
      description: 'soporte@studysync.co',
      href: 'mailto:soporte@studysync.co',
    },
    {
      icon: 'clock',
      title: t('page.channels.hours.title'),
      description: t('page.channels.hours.description'),
    },
    {
      icon: 'mapPin',
      title: t('page.channels.location.title'),
      description: t('page.channels.location.description'),
    },
  ];
}

function ContactInfoCard({ channel }: { channel: ContactChannel }) {
  return (
    <li className="border-border bg-surface/60 hover:bg-surface-hover flex items-start gap-4 rounded-2xl border p-4 backdrop-blur-sm transition-colors">
      <span
        aria-hidden="true"
        className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl"
      >
        <AppIcon category="ui" name={channel.icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-foreground font-serif text-base font-semibold">
          {channel.title}
        </h3>
        <p className="text-foreground-muted mt-1 font-sans text-sm">
          {channel.href ? (
            <a
              href={channel.href}
              className="hover:text-foreground focus-visible:ring-border-focus rounded-sm underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {channel.description}
            </a>
          ) : (
            channel.description
          )}
        </p>
      </div>
    </li>
  );
}

/* ====================================================
   Página
   ==================================================== */

export default async function ContactPage() {
  const t = await getTranslations('contact');
  const contactChannels = getContactChannels(t);

  // Solo se envía al cliente el namespace de validación, no todos los mensajes.
  const validation = (await getMessages()).Validation as ValidationDict;

  const messages = {
    title: t('form.title'),
    description: t('form.description'),
    legend: t('form.legend'),

    fields: {
      name: {
        label: t('form.fields.name.label'),
        placeholder: t('form.fields.name.placeholder'),
      },
      email: {
        label: t('form.fields.email.label'),
        placeholder: t('form.fields.email.placeholder'),
      },
      contactNumber: {
        label: t('form.fields.contactNumber.label'),
        optional: t('form.fields.contactNumber.optional'),
        placeholder: t('form.fields.contactNumber.placeholder'),
      },
      subject: {
        label: t('form.fields.subject.label'),
        placeholder: t('form.fields.subject.placeholder'),
      },
      message: {
        label: t('form.fields.message.label'),
        placeholder: t('form.fields.message.placeholder'),
      },
    },

    success: {
      title: t('form.success.title'),
      description: t('form.success.description'),
      sendAnother: t('form.success.sendAnother'),
    },

    error: {
      unexpected: t('form.error.unexpected'),
      sendFailed: t('form.error.sendFailed'),
      rateLimited: t('form.error.rateLimited'),
      invalidData: t('form.error.invalidData'),
      serverError: t('form.error.serverError'),
      unavailable: t('form.error.unavailable'),
    },

    actions: {
      sending: t('form.actions.sending'),
      submit: t('form.actions.submit'),
    },
  };

  return (
    <main className="bg-background text-foreground grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
      {/* Columna izquierda: showcase / información de contacto */}
      <section
        aria-labelledby="contact-title"
        className="relative isolate overflow-hidden px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
      >
        {/* Decoración: grilla y resplandores (ocultos para tecnologías de asistencia) */}
        <svg
          aria-hidden="true"
          className="text-border/60 absolute inset-0 -z-10 size-full mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
        >
          <defs>
            <pattern
              id="contact-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M48 0H0V48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contact-grid)" />
        </svg>
        <div
          aria-hidden="true"
          className="bg-primary/10 pointer-events-none absolute -top-24 -left-24 -z-10 size-96 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-accent/10 pointer-events-none absolute -right-24 -bottom-24 -z-10 size-96 rounded-full blur-3xl"
        />
        <div className="mx-auto max-w-2xl lg:mx-0">
          <p className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-sans text-sm font-medium">
            <AppIcon category="ui" name="message" className="size-4" />
            {t('page.eyebrow')}
          </p>
          <h1
            id="contact-title"
            className="text-foreground mt-6 font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t('page.title.before')}{' '}
            <span className="text-primary">{t('page.title.highlight')}</span>
          </h1>
          <p className="text-foreground-muted mt-5 max-w-xl font-sans text-base text-pretty sm:text-lg">
            {t('page.description')}
          </p>
          <ul role="list" className="mt-10 space-y-4">
            {contactChannels.map((channel) => (
              <ContactInfoCard key={channel.title} channel={channel} />
            ))}
          </ul>
        </div>
      </section>

      {/* Columna derecha: formulario */}
      <section className="flex items-center justify-center px-4 pb-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="border-border bg-surface w-full max-w-xl rounded-3xl border p-7 shadow-xl">
          <ContactForm messages={messages} validation={validation} />
        </div>
      </section>
    </main>
  );
}

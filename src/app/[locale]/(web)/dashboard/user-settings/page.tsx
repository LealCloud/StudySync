import { Fragment } from 'react';
import { auth } from '@/auth';
import {
  getVisibleSections,
  type UserSettingsSectionId,
} from '@/config/user-settings-sections';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { AccountSection } from './AccountSection';
import { BillingSection } from './BillingSection';
import { CertificatesSection } from './CertificatesSection';
import { CoursesSection } from './CoursesSection';
import { PersonalDataSection } from './PersonalDataSection';
import { PreferencesSection } from './PreferencesSection';
import { PrivacySection } from './PrivacySection';
import { ProfileSection } from './ProfileSection';
import { SecuritySection } from './SecuritySection';

function renderSection(id: UserSettingsSectionId): React.ReactNode {
  switch (id) {
    case 'profile':
      return <ProfileSection />;
    case 'personalData':
      return <PersonalDataSection />;
    case 'preferences':
      return <PreferencesSection />;
    case 'privacy':
      return <PrivacySection />;

    case 'security':
      return <SecuritySection />;

    case 'account':
      return <AccountSection />;

    case 'courses':
      return <CoursesSection />;

    case 'certificates':
      return <CertificatesSection />;

    case 'billing':
      return <BillingSection />;

    default:
      return null;
  }
}

export async function generateMetadata() {
  const t = await getTranslations('dashboard.userSettings.metadata');
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, googleBot: { index: false, follow: false } },
  };
}

export default async function ProfilePage() {
  const [session, t, locale] = await Promise.all([
    auth(),
    getTranslations('dashboard.userSettings.page'),
    getLocale(),
  ]);

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // session.user se limita a id, role y error (ver src/auth.ts).
  // Los datos de presentación (nombre, correo, imagen, plan) los entrega
  // el BFF vía GraphQL dentro de ProfileSection.
  const { role } = session.user;
  const sections = getVisibleSections(role);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-foreground-muted mt-1 text-sm">{t('description')}</p>
      </header>

      <div className="grid gap-6">
        {sections.map((id) => {
          const node = renderSection(id);
          if (node === null) return null;
          return <Fragment key={id}>{node}</Fragment>;
        })}
      </div>
    </div>
  );
}

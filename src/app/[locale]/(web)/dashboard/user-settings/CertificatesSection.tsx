import { SectionCard } from '@/components/ui/SectionCard';
import { getMessages, getTranslations } from 'next-intl/server';
import { CertificateEligibility } from './CertificateEligibility';
import { CertificatesClient } from './CertificatesClient';

export async function CertificatesSection() {
  const [t, certT, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.certificates'),
    getTranslations('dashboard.userSettings.certificates.eligibility'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.certificates;

  const eligibilityMessages = {
    title: certT('title'),
    description: certT('description'),
    eligible: certT('eligible'),
    pending: certT('pending'),
    avatar: certT('avatar'),
    personalData: certT('personalData'),
    verified: certT('verified'),
    comingSoon: certT('comingSoon'),
  };

  return (
    <>
      <CertificateEligibility messages={eligibilityMessages} />

      <SectionCard title={t('title')} description={t('description')}>
        <CertificatesClient messages={messages} />
      </SectionCard>
    </>
  );
}

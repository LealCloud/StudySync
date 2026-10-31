import { SectionCard } from '@/components/ui/SectionCard';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import { PrivacyFormClient } from './PrivacyFormClient';

export async function PrivacySection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.privacy'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.privacy;
  const validation = allMessages.Validation as ValidationDict;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <PrivacyFormClient messages={messages} validation={validation} />
    </SectionCard>
  );
}

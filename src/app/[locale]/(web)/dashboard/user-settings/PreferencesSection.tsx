import { SectionCard } from '@/components/ui/SectionCard';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import { PreferencesFormClient } from './PreferencesFormClient';

export async function PreferencesSection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.preferences'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.preferences;
  const validation = allMessages.Validation as ValidationDict;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <PreferencesFormClient messages={messages} validation={validation} />
    </SectionCard>
  );
}

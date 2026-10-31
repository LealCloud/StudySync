import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import { SectionCard } from '@/components/ui/SectionCard';
import { PersonalDataFormClient } from './PersonalDataFormClient';

export async function PersonalDataSection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.personalData'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.personalData;
  const validation = allMessages.Validation as ValidationDict;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <PersonalDataFormClient messages={messages} validation={validation} />
    </SectionCard>
  );
}

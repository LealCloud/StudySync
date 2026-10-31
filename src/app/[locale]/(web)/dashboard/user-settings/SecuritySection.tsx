import { SectionCard } from '@/components/ui/SectionCard';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import { SecurityOverviewClient } from './SecurityOverviewClient';

export async function SecuritySection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.security'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.security;
  const validation = allMessages.Validation as ValidationDict;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <SecurityOverviewClient messages={messages} validation={validation} />
    </SectionCard>
  );
}

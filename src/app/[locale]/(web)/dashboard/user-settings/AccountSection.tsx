import { SectionCard } from '@/components/ui/SectionCard';
import { getMessages, getTranslations } from 'next-intl/server';
import { AccountClient } from './AccountClient';

export async function AccountSection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.account'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.account;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <AccountClient messages={messages} />
    </SectionCard>
  );
}

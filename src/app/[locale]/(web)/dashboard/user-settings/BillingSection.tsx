import { SectionCard } from '@/components/ui/SectionCard';
import { getMessages, getTranslations } from 'next-intl/server';
import { BillingOverviewClient } from './BillingOverviewClient';

export async function BillingSection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.billing'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.billing;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <BillingOverviewClient messages={messages} />
    </SectionCard>
  );
}

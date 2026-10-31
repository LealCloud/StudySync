import { SectionCard } from '@/components/ui/SectionCard';
import { getMessages, getTranslations } from 'next-intl/server';
import { CoursesClient } from './CoursesClient';

export async function CoursesSection() {
  const [t, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.courses'),
    getMessages(),
  ]);

  const messages = allMessages.dashboard.userSettings.courses;

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <CoursesClient messages={messages} />
    </SectionCard>
  );
}

import { getTranslations } from 'next-intl/server';
import LanguageToggleClient from './LanguageToggleClient';
interface LanguageToggleProps {
  className?: string;
}
export default async function LanguageToggle({
  className,
}: LanguageToggleProps) {
  const t = await getTranslations('languageToggle');
  return (
    <LanguageToggleClient
      className={className}
      switchToSpanish={t('switchTo', { language: t('es') })}
      switchToEnglish={t('switchTo', { language: t('en') })}
    />
  );
}

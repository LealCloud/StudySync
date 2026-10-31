import { getTranslations } from 'next-intl/server';

import ThemeToggleClient from './ThemeToggleClient';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export default async function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const t = await getTranslations('themeToggle');

  return (
    <ThemeToggleClient
      size={size}
      toLightLabel={t('toLight')}
      toDarkLabel={t('toDark')}
    />
  );
}

import LanguageToggle from '@/components/ui/LanguageToggle/LanguageToggle';
import Logo from '@/components/ui/logo';
import ThemeToggle from '@/components/ui/ThemeToggle/ThemeToggle';
import { HEADER_LINKS } from '@/config/navigation';
import { getTranslations } from 'next-intl/server';
import { Button } from '../../../ui/Button';
import HeaderNavigation from './HeaderNavigation';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const t = await getTranslations('header');
  const tLinks = await getTranslations('header.links');

  const navigationLinks = HEADER_LINKS.map((link) => ({
    ...link,
    label: tLinks(link.labelKey),
  }));

  return (
    <header className="border-border bg-background/76 fixed top-0 left-0 z-50 flex min-h-20 w-full items-center justify-between border-b px-6 backdrop-blur-md sm:px-12">
      {/* Brand / Logo */}
      <Logo />

      {/* Navigation Menu - Desktop */}
      <HeaderNavigation links={navigationLinks} ariaLabel={t('navLabel')} />

      {/* Actions - Desktop */}
      <div className="hidden items-center gap-4 lg:flex">
        <LanguageToggle />

        <ThemeToggle size="sm" />

        <Button href="/login" variant="ghost" size="sm">
          {t('login')}
        </Button>

        <Button
          href="/register"
          variant="primary"
          size="sm"
          icon="arrowRight"
          iconPosition="right"
        >
          {t('register')}
        </Button>
      </div>

      {/* Navigation Menu - Mobile */}
      <MobileMenu
        links={navigationLinks}
        openMenuLabel={t('openMenu')}
        closeMenuLabel={t('closeMenu')}
        languageLabel={t('language')}
        themeLabel={t('theme')}
        loginLabel={t('login')}
        registerLabel={t('register')}
        languageSlot={<LanguageToggle />}
        themeSlot={<ThemeToggle size="sm" />}
      />
    </header>
  );
}

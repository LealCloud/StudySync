'use client';

import { HEADER_LINKS, isNavLinkActive } from '@/config/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../../ui/Button';

const MOBILE_MENU_ID = 'mobile-menu';

interface MobileMenuProps {
  links: Array<
    (typeof HEADER_LINKS)[number] & {
      label: string;
    }
  >;
  openMenuLabel: string;
  closeMenuLabel: string;
  languageLabel: string;
  themeLabel: string;
  loginLabel: string;
  registerLabel: string;
  languageSlot: ReactNode;
  themeSlot: ReactNode;
}

export default function MobileMenu({
  links,
  openMenuLabel,
  closeMenuLabel,
  languageLabel,
  themeLabel,
  loginLabel,
  registerLabel,
  languageSlot,
  themeSlot,
}: MobileMenuProps) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Cierra el menú móvil con Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Botón del menú - Mobile */}
      <Button
        variant="ghost"
        size="lg"
        icon={mobileMenuOpen ? 'close' : 'menu'}
        className="text-foreground lg:hidden"
        aria-label={mobileMenuOpen ? closeMenuLabel : openMenuLabel}
        aria-expanded={mobileMenuOpen}
        aria-controls={MOBILE_MENU_ID}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Navigation Menu - Mobile */}
      {mobileMenuOpen && (
        <div
          id={MOBILE_MENU_ID}
          className="border-border bg-background absolute top-20 right-4 left-4 z-50 flex max-h-[calc(100dvh-6rem)] flex-col items-stretch gap-1 overflow-y-auto rounded-2xl border p-4 shadow-2xl lg:hidden"
        >
          {links.map((link) => {
            const isActive = isNavLinkActive(pathname, link);
            const isExternal = link.href.startsWith('http');

            if (isExternal) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`relative rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 ${
                    isActive
                      ? 'text-foreground bg-surface-active'
                      : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
                  }`}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 ${
                  isActive
                    ? 'text-foreground bg-surface-active'
                    : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
                }`}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            );
          })}

          <hr className="border-border my-3" />

          {/* Preferencias: idioma y tema (slots del servidor) */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3">
            <div className="flex items-center gap-2.5">
              <span className="text-foreground-muted text-xs font-semibold">
                {languageLabel}
              </span>

              {languageSlot}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-foreground-muted text-xs font-semibold">
                {themeLabel}
              </span>

              {themeSlot}
            </div>
          </div>

          <hr className="border-border my-3" />

          {/* Login */}
          <Button
            href="/login"
            variant="ghost"
            size="sm"
            fullWidth
            onClick={closeMobileMenu}
          >
            {loginLabel}
          </Button>

          {/* Registro */}
          <Button
            href="/register"
            variant="primary"
            size="sm"
            icon="arrowRight"
            iconPosition="right"
            fullWidth
            onClick={closeMobileMenu}
          >
            {registerLabel}
          </Button>
        </div>
      )}
    </>
  );
}

'use client';

import { HEADER_LINKS, isNavLinkActive } from '@/config/navigation';
import { Link, usePathname } from '@/i18n/navigation';

interface HeaderNavigationProps {
  links: Array<
    (typeof HEADER_LINKS)[number] & {
      label: string;
    }
  >;
  ariaLabel: string;
}

export default function HeaderNavigation({
  links,
  ariaLabel,
}: HeaderNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-6 lg:flex lg:gap-8"
      aria-label={ariaLabel}
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
              className={`relative px-0 py-7 text-xs font-bold transition-colors duration-200 ${
                isActive
                  ? 'text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {link.label}

              <span
                className={`bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-full shadow-md transition-transform duration-200 ${
                  isActive ? 'scale-x-100' : 'scale-x-0'
                }`}
                aria-hidden="true"
              />
            </a>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-0 py-7 text-xs font-bold transition-colors duration-200 ${
              isActive
                ? 'text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {link.label}

            <span
              className={`bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-full shadow-md transition-transform duration-200 ${
                isActive ? 'scale-x-100' : 'scale-x-0'
              }`}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}

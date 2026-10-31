import Logo from '@/components/ui/logo';
import { useTranslations } from 'next-intl';
import { CustomLink } from '../../ui/Link';

export default function Footer() {
  const t = useTranslations('footer');

  const FOOTER_LINKS = [
    {
      title: t('sections.platform'),
      links: [
        { name: t('links.courses'), href: '#' },
        { name: t('links.learningPaths'), href: '#' },
        { name: t('links.pricing'), href: '#' },
      ],
    },
    {
      title: t('sections.community'),
      links: [
        { name: t('links.about'), href: '#' },
        { name: t('links.blog'), href: '#' },
        { name: t('links.forum'), href: '#' },
      ],
    },
    {
      title: t('sections.support'),
      links: [
        { name: t('links.helpCenter'), href: '#' },
        { name: t('links.contact'), href: '#' },
        { name: t('links.status'), href: '#' },
      ],
    },
  ];

  const LEGAL_LINKS = [
    { name: t('legal.privacy'), href: '#' },
    { name: t('legal.terms'), href: '#' },
  ];

  return (
    <footer className="bg-background border-border mt-auto w-full border-t px-4 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <section className="md:col-span-1">
            <Logo />
            <p className="text-foreground-muted mt-4 max-w-xs text-sm">
              {t('description')}
            </p>
          </section>

          {FOOTER_LINKS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="text-foreground mb-4 font-serif font-semibold">
                {section.title}
              </h2>
              <ul className="text-foreground-muted space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <CustomLink
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </CustomLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-foreground-muted text-sm">{t('copyright')}</p>
          <nav aria-label="Legal">
            <ul className="text-foreground-muted flex space-x-6 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.name}>
                  <CustomLink
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </CustomLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

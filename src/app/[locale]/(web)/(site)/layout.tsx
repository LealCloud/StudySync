import type { Metadata } from 'next';

import { Plus_Jakarta_Sans, Public_Sans } from 'next/font/google';

import '../globals.css';

import Footer from '@/components/layout/web/Footer';
import Header from '@/components/layout/web/header/Header';

import { ThemeProvider } from '@/components/ui/ThemeProvider';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
});

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

// TODO: Generar metadatos dinámicos (generateMetadata) basados en el idioma actual (locale) para SEO e internacionalización.

export const metadata: Metadata = {
  title: 'StudySync',
  description: 'Aprende. Conecta. Avanza.',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${plusJakartaSans.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider
          storageKey="theme"
          defaultTheme="system"
          enableSystem
          enableColorScheme
          themes={['light', 'dark']}
          attribute="data-theme"
        >
          <NextIntlClientProvider>
            <Header />

            <main className="min-h-screen pt-20">{children}</main>

            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Public_Sans } from 'next/font/google';
import '../globals.css';

import SideBar from '@/components/layout/dashboard/sidebar/SideBar';
import { UrqlProvider } from '@/components/providers/UrqlProvider';
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

// Metadatos optimizados para el Dashboard
export const metadata: Metadata = {
  title: 'Dashboard | StudySync',
  description:
    'Panel de control de StudySync. Gestiona tu aprendizaje, conexiones y progreso.',
  robots: {
    index: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default async function DashboardLayout({
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
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider
          storageKey="theme"
          defaultTheme="system"
          enableSystem={true}
          enableColorScheme={true}
          themes={['light', 'dark']}
          attribute="data-theme"
        >
          <NextIntlClientProvider>
            <UrqlProvider>
              <div className="flex min-h-screen w-full">
                <SideBar />
                <main className="bg-background min-h-screen flex-1">
                  {children}
                </main>
              </div>
            </UrqlProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

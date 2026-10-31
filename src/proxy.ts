import { auth } from '@/auth';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Procesar primero las rutas de next-intl
  const intlResponse = handleI18nRouting(req);

  // Verificar autenticación
  const isLoggedIn = !!req.auth;

  // Quitar el prefijo de idioma para comprobar rutas protegidas
  const pathnameWithoutLocale =
    pathname.replace(/^\/(es|en)(?=\/|$)/, '') || '/';

  // Proteger /dashboard y sus rutas hijas
  if (pathnameWithoutLocale.startsWith('/dashboard') && !isLoggedIn) {
    const localeMatch = pathname.match(/^\/(es|en)(?=\/|$)/);
    const locale = localeMatch?.[1] ?? routing.defaultLocale;

    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return intlResponse;
});

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};

// src/i18n/request.ts
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

type Locale = (typeof routing.locales)[number];

// Un JSON por locale. Los namespaces son claves anidadas dentro del JSON.
// Al agregar un locale: crear messages/<locale>.json y añadirlo aquí.
const MESSAGE_LOADERS: Record<
  Locale,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => import('../messages/en.json'),
  es: () => import('../messages/es.json'),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  const locale: Locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const { default: messages } = await MESSAGE_LOADERS[locale]();

  return { locale, messages };
});

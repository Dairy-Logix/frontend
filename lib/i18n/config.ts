import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/constants';
import type { SupportedLocale } from '@/lib/types';

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { SupportedLocale };

export function getLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const saved = localStorage.getItem('preferred-locale') as SupportedLocale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved;
  }
  return DEFAULT_LOCALE;
}

import i18n from '@/shared/lib/i18n/server';

/**
 * Initialize i18n with the correct language for server-side rendering
 * @param locale - The locale to use ('de' or 'en')
 */
export async function initializeI18n(locale: string) {
  if (typeof window === 'undefined') {
    // On server, set the language
    await i18n.changeLanguage(locale);
  }
  return i18n;
}

/**
 * Get the current language, with fallback to 'de'
 */
export function getCurrentLanguage(): string {
  return i18n.language || 'de';
}

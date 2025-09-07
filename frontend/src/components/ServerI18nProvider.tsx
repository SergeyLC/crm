import React from 'react';
import i18n from '@/shared/lib/i18n/server';

interface ServerI18nProviderProps {
  children: React.ReactNode;
  locale: string;
}

/**
 * Server-side I18nProvider that initializes i18n with the correct language
 * This ensures that server-side rendering uses the correct locale
 */
export async function ServerI18nProvider({ children, locale }: ServerI18nProviderProps) {
  // Initialize i18n with the correct language on the server
  if (typeof window === 'undefined') {
    await i18n.changeLanguage(locale);
  }

  return <>{children}</>;
}

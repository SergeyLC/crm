"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

/**
 * Ensures a single initialized i18n instance is available to all client components.
 * Also switches language based on the current pathname (/en prefix => English, otherwise German).
 */
export function I18nProvider({ children, locale: forcedLocale }: { children: React.ReactNode; locale?: string }) {
  const pathname = usePathname() || '/';
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized) {
      // In rare race conditions init may not yet have completed when this component mounts
      i18n.on('initialized', () => setReady(true));
    }
  }, []);

  useEffect(() => {
    const pathLang = pathname.startsWith('/en') ? 'en' : 'de';
    const effective = (forcedLocale === 'en' || forcedLocale === 'de') ? forcedLocale : pathLang;
    if (i18n.language !== effective) {
      i18n.changeLanguage(effective).catch(console.error);
    }
    // Ensure <html lang> stays in sync (root layout owns the tag)
    if (typeof document !== 'undefined' && document.documentElement.lang !== effective) {
      document.documentElement.lang = effective;
    }
  }, [pathname, forcedLocale]);

  if (!ready) {
    // Lightweight fallback avoids triggering the hook warning before init is done
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18nProvider;

"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { changeLanguage } from '../i18n';

/**
 * Client-side I18nProvider that handles language switching
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] === 'en' ? 'en' : 'de';

      // Change language based on URL path
      changeLanguage(locale);
    }
  }, [pathname]);

  return <>{children}</>;
}

export default I18nProvider;

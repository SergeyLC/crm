"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n/client';

/**
 * Client-side I18nProvider that handles language switching and provides i18next context
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (pathname) {
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] === 'en' ? 'en' : 'de';

      // Change language based on URL path
      if (i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
    }
  }, [pathname]);

  // Don't render the I18nextProvider until we're on the client
  // This prevents hydration mismatches
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

export default I18nProvider;

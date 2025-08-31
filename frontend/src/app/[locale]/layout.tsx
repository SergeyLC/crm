import React, { ReactNode } from 'react';
import { Providers } from '@/app/store/Providers';
import { AuthProvider } from '@/features/auth/ui';
import I18nProvider from '@/components/I18nProvider';

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }];
}

export default function LocaleLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  const { locale } = params;
  return (
    <Providers>
      <AuthProvider>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </AuthProvider>
    </Providers>
  );
}
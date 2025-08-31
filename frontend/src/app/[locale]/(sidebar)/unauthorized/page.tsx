"use client";
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UnauthorizedPage() {
  const { t } = useTranslation('auth');
  const pathname = usePathname();
  const seg = pathname?.split('/').filter(Boolean)[0];
  const locale = seg === 'en' ? 'en' : 'de';
  return (
    <div style={{padding:32,fontFamily:'sans-serif'}}>
      <h1>{t('unauthorized','Unauthorized')}</h1>
      <p>{t('unauthorizedMessage','You do not have access to this page.')}</p>
      <p><Link href={`/${locale}`}>{t('goHome','Go home')}</Link></p>
    </div>
  );
}

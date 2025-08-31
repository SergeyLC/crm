"use client";
import { usePathname } from 'next/navigation';

export function useLocale() {
  const pathname = usePathname() || '/';
  const seg = pathname.split('/').filter(Boolean)[0];
  const locale = seg === 'en' || seg === 'de' ? seg : 'de';
  return locale;
}

export function localePath(path: string, locale: string) {
  if (!path.startsWith('/')) path = '/' + path;
  // Avoid double locale if already present
  if (path === '/en' || path.startsWith('/en/') || path === '/de' || path.startsWith('/de/')) {
    return path;
  }
  if (path === '/') return `/${locale}`;
  return `/${locale}${path}`;
}

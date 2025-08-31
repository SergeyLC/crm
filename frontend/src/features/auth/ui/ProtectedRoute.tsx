"use client";
import { useEffect } from "react";
import ContentSkeleton from '@/shared/ui/ContentSkeleton';
import { useAuth } from "../hooks";
import { useRouter, usePathname } from "next/navigation";
import { UserRole } from "../model/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const segments = (pathname || '/').split('/').filter(Boolean);
    const locale = segments[0] === 'en' ? 'en' : 'de';
    const withLocale = (p: string) => `/${locale}${p.startsWith('/') ? p : '/' + p}`;

    if (!isLoading && !isAuthenticated) {
      router.push(withLocale(`/login?returnUrl=${encodeURIComponent(pathname || "")}`));
      return;
    }

    if (!isLoading && isAuthenticated && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push(withLocale('/unauthorized'));
    }
  }, [isLoading, isAuthenticated, user, router, pathname, allowedRoles]);

  if (isLoading) {
    return <ContentSkeleton header={false} blocks={0} lines={1} dense />;
  }

  if (isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role)))) {
    return <>{children}</>;
  }

  return null;
};

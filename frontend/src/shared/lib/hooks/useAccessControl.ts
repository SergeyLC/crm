"use client";

import { useRouter } from "next/navigation";
import { useLocale, localePath } from '@/shared/lib/hooks/useLocale';
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect } from "react";
import { UserRole } from "@/entities/user";

interface UseAccessControlOptions {
  requiredRole?: UserRole;
  redirectPath?: string;
}

export function useAccessControl({
  requiredRole = "ADMIN",
  redirectPath = "/",
}: UseAccessControlOptions = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const hasAccess =
    !isLoading &&
    !!isAuthenticated &&
    !!user &&
    ((requiredRole === "ADMIN" && user.role === "ADMIN") ||
      (requiredRole === "EMPLOYEE" &&
        ["ADMIN", "EMPLOYEE"].includes(user.role)));

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push(localePath('/login', locale));
      return;
    }

    if (!hasAccess) {
      router.push(localePath(redirectPath, locale));
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    hasAccess,
    requiredRole,
    redirectPath,
    router,
    locale,
  ]);

  return {
    hasAccess,
    isLoading: isLoading || !hasAccess,
  };
}

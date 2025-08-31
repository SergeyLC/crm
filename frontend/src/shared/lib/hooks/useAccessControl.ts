"use client";

import { useRouter } from "next/navigation";
import { useLocale, localePath } from '@/shared/lib/hooks/useLocale';
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect, useState } from "react";
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
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Если загрузка завершена и пользователь авторизован
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Проверяем роль пользователя
        if (requiredRole === "ADMIN" && user.role === "ADMIN") {
          setHasAccess(true);
        } else if (requiredRole === "EMPLOYEE" && ["ADMIN", "EMPLOYEE"].includes(user.role)) {
          setHasAccess(true);
        } else {
          // Если нет доступа - редирект
          router.push(localePath(redirectPath, locale));
        }
      } else {
        // Не авторизован - редирект
  router.push(localePath('/login', locale));
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, redirectPath, router, locale]);

  return {
    hasAccess,
    isLoading: isLoading || !hasAccess,
  };
}
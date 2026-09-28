"use client";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider, LoginForm } from "@/features/auth";
import { Providers } from "@/app/store/Providers";

export default function LoginPage() {
  const { t } = useTranslation('login');
  return (
    <Providers>
      <AuthProvider>
        <Suspense fallback={<div>{t("loading")}</div>}>
          <LoginForm />
        </Suspense>
      </AuthProvider>
    </Providers>
  );
}

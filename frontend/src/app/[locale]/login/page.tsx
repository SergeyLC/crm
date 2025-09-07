"use client";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider, LoginForm } from "@/features";
import { Providers } from "@/app/store/Providers";
import { I18nProvider } from "@/components/I18nProvider";

export default function LoginPage() {
  const { t } = useTranslation('login');
  return (
    <Providers>
      <I18nProvider>
        <AuthProvider>
          <Suspense fallback={<div>{t("loading")}</div>}>
            <LoginForm />
          </Suspense>
        </AuthProvider>
      </I18nProvider>
    </Providers>
  );
}

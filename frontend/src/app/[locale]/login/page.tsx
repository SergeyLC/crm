"use client";
import { Suspense } from "react";
import { AuthProvider } from "@/features/auth";
import { LoginForm } from "@/features/auth/ui/LoginForm/LoginForm";
import { Providers } from "@/app/store/Providers";

/**
 * Avoid useTranslation in this shell — Suspense fallback text that differs
 * server vs client (missing ns / lng) triggers React hydration #418.
 */
export default function LoginPage() {
  return (
    <Providers>
      <AuthProvider>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </AuthProvider>
    </Providers>
  );
}

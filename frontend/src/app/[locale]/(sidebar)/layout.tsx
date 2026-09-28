import React, { ReactNode, Suspense } from "react";
import ContentSkeleton from "@/shared/ui/ContentSkeleton";
import { AuthProvider, ProtectedRoute } from "@/features/auth";
import { Providers } from "@/app/store/Providers";
import ClientSidebarLayout from "./ClientSidebarLayout";

// Layout for all routes inside the (sidebar) group under [locale]
// I18nProvider lives in [locale]/layout — do not wrap again here.
export default function SidebarGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Providers>
      <AuthProvider>
        <ProtectedRoute>
          <ClientSidebarLayout>
            <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
          </ClientSidebarLayout>
        </ProtectedRoute>
      </AuthProvider>
    </Providers>
  );
}

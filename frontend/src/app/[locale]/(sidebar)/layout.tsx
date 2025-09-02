import React, { ReactNode, Suspense } from "react";
import ContentSkeleton from "@/shared/ui/ContentSkeleton";
import { AuthProvider } from "@/features/auth/ui";
import { Providers } from "@/app/store/Providers";
import I18nProvider from "@/components/I18nProvider";
import ClientSidebarLayout from "./ClientSidebarLayout";

// Layout for all routes inside the (sidebar) group under [locale]
// Provides persistent navigation drawer next to page content.
export default function SidebarGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Providers>
      <I18nProvider>
        <AuthProvider>
          <ClientSidebarLayout>
            <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
          </ClientSidebarLayout>
        </AuthProvider>
      </I18nProvider>
    </Providers>
  );
}

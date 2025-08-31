"use client";
import React, { ReactNode, Suspense, useMemo } from "react";
import { SidebarDrawer } from "@/shared/ui/SidebarDrawer";
import "@/i18n";
import ContentSkeleton, {
  SkeletonConfigProvider,
} from "@/shared/ui/ContentSkeleton";
import { getSkeletonConfig } from "@/shared/lib/skeletonRouteConfig";
import { usePathname } from "next/navigation";
// import ContentSkeleton from "@/shared/ui/ContentSkeleton";

// const SidebarLoading = ContentSkeleton;

// Layout for all routes inside the (sidebar) group under [locale]
// Provides persistent navigation drawer next to page content.
export default function SidebarGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const cfg = useMemo(() => getSkeletonConfig(pathname), [pathname]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", overflow: "hidden" }}>
      <SidebarDrawer />
      <main style={{ flex: "1", display: "flex", width: "100%", boxSizing: "border-box" }}>
        <SkeletonConfigProvider value={cfg}>
          <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
        </SkeletonConfigProvider>
      </main>
    </div>
  );
}

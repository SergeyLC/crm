"use client";
import React, { ReactNode, Suspense, useMemo } from "react";
import { SidebarDrawer } from "@/shared/ui/SidebarDrawer";
import "@/i18n";
import ContentSkeleton, {
  SkeletonConfigProvider,
} from "@/shared/ui/ContentSkeleton";
import { getSkeletonConfig } from "@/shared/lib/skeletonRouteConfig";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
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
    <Box
      sx={{
        display: "flex",
        minWidth: 0,
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        alignItems: "stretch",
        m: 0,
        p: 0,
      }}
    >
      <SidebarDrawer />
      <Box
        component="main"
        sx={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          p: 0,
          bgcolor: "background.default",
          overflowY: "auto",
          alignItems: "stretch",
        }}
      >
        <SkeletonConfigProvider value={cfg}>
          <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
        </SkeletonConfigProvider>
      </Box>
    </Box>
  );
}

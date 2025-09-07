"use client";
import React, { ReactNode, useMemo } from "react";
import { SidebarDrawer } from "@/shared/ui/SidebarDrawer/SidebarDrawer";
import Box from "@mui/material/Box";
import { usePathname } from "next/navigation";
import { SkeletonConfigProvider } from "@/shared/ui/ContentSkeleton";
import { getSkeletonConfig } from "@/shared/lib/skeletonRouteConfig";

interface ClientSidebarLayoutProps {
  children: ReactNode;
}

export default function ClientSidebarLayout({ children }: ClientSidebarLayoutProps) {
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
          {children}
        </SkeletonConfigProvider>
      </Box>
    </Box>
  );
}

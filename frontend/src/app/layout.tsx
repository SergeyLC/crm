import React from "react";
import { Providers } from "./store/Providers";
import Box from "@mui/material/Box";
import { SidebarDrawer } from "@/shared";

import { AuthProvider } from "@/features/auth/ui/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SidebarDrawer is a client component; it handles its own state

  return (
    <html lang="en">
      <head>
        <title>LoyaCRM</title>
        <meta name="description" content="LoyaCare CRM - Your CRM Solution" />
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body style={{ margin: 0 }}>
        <Providers>
          {/* <ThemeRegistry> */}
            <AuthProvider>
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
                  {children}
                </Box>
              </Box>
            </AuthProvider>
          {/* </ThemeRegistry> */}
        </Providers>
      </body>
    </html>
  );
}

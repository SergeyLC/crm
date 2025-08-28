"use client";

import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./index"; // Импортируем тему

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {/* <CssBaseline /> */}
      {children}
    </ThemeProvider>
  );
}
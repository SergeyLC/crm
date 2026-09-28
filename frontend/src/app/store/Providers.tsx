"use client";
import React from "react";
import type { ReactNode } from "react";
import { QueryProvider } from "@/shared/lib/query";
import { DialogProvider } from "@/shared/lib/dialog";
import { DeferredSnackbarProvider } from "./DeferredSnackbarProvider";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * App-wide providers. Heavy UI (notistack, dialog shell) loads deferred / on demand.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <DeferredSnackbarProvider>
        <DialogProvider>{children}</DialogProvider>
      </DeferredSnackbarProvider>
    </QueryProvider>
  );
}

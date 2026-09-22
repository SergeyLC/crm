"use client";
import React from 'react';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/shared/lib/query';
import { SnackbarProvider } from 'notistack';
import { DialogProvider } from '@/shared/lib/dialog';

interface ProvidersProps { children: ReactNode }

/**
 * Universal Providers that works on both server and client
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <DialogProvider>
          {children}
        </DialogProvider>
      </SnackbarProvider>
    </QueryProvider>
  );
}

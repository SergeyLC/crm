"use client";
import React from 'react';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/shared/lib/QueryProvider';

interface ProvidersProps { children: ReactNode }

export function Providers({ children }: ProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}

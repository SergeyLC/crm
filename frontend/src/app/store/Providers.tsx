"use client";
import React from 'react';
import type { ReactNode } from 'react';
import { Provider as ReduxOriginalProvider } from 'react-redux';
import { store } from '@/shared/lib/store';

interface ProvidersProps { children: ReactNode }

// Re-export a thin wrapper to avoid generic inference noise from RTK Query's deep union type.
// Minimal typed facade: assert the original Provider accepts our store + children.
// This avoids re-triggering the complex conditional type that incorrectly drops `children`.
const SafeProvider = ReduxOriginalProvider as unknown as React.ComponentType<{ store: typeof store; children: ReactNode }>;

export function Providers({ children }: ProvidersProps) {
  // Use createElement + cast to avoid TS incorrectly thinking children prop missing.
  const Comp = SafeProvider as unknown as React.ComponentType<{ store: typeof store; children?: ReactNode }>;
  return React.createElement(Comp, { store }, children);
}

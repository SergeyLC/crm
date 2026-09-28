"use client";

import React, { useEffect, useState, type ComponentType, type ReactNode } from "react";

type SnackbarProviderProps = {
  children?: ReactNode;
  maxSnack?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
};

/**
 * Loads notistack after mount so it stays out of the initial JS graph.
 * Children render immediately; the provider wraps them once the chunk is ready.
 */
export function DeferredSnackbarProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<SnackbarProviderProps> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void import("notistack").then((mod) => {
      if (!cancelled) {
        setProvider(() => mod.SnackbarProvider as ComponentType<SnackbarProviderProps>);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Provider) {
    return <>{children}</>;
  }

  return (
    <Provider
      maxSnack={3}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      {children}
    </Provider>
  );
}

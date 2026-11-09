"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { createQueryClient } from "./client";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (m) => m.ReactQueryDevtools
          ),
        { ssr: false }
      )
    : () => null;

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // One client per React tree (browser session / SSR request). A module-level
  // singleton retained full deal/lead payloads across requests and drove OOM.
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

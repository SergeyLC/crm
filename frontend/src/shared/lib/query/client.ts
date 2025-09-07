import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
      retry: 1,
      // Enable background refetching for better UX
      refetchOnMount: true,
      refetchOnReconnect: false,
    },
  },
});

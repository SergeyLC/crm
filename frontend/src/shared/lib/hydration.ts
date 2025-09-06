import { createApi } from "@reduxjs/toolkit/query/react";

// Define HYDRATE action type for SSR
const HYDRATE = "__NEXT_REDUX_WRAPPER_HYDRATE__";

/**
 * Creates a hydrated RTK Query API for Next.js SSR
 * This provides proper SSR support without requiring next-redux-wrapper
 */
export function createHydratedApi<T extends Parameters<typeof createApi>[0]>(options: T) {
  // We build the options object dynamically then cast to unknown to avoid
  // TypeScript structural mismatch with createApi's complex generic types.
  const opts = {
    ...(options as Parameters<typeof createApi>[0]),
    extractRehydrationInfo(action: unknown, { reducerPath }: { reducerPath: string }) {
      const act = action as { type?: string; payload?: Record<string, unknown> } | undefined;
      if (act?.type === HYDRATE) {
        return act.payload?.[reducerPath];
      }
      return undefined;
    },
  };

  return createApi(opts as unknown as Parameters<typeof createApi>[0]);
}

/**
 * Creates a HYDRATE action for server-side store hydration
 */
export function createHydrateAction(payload: Record<string, unknown>) {
  return {
    type: HYDRATE,
    payload,
  };
}

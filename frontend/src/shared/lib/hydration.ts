import { createApi } from "@reduxjs/toolkit/query/react";

// Define HYDRATE action type for SSR
const HYDRATE = "__NEXT_REDUX_WRAPPER_HYDRATE__";

/**
 * Creates a hydrated RTK Query API for Next.js SSR
 * This provides proper SSR support without requiring next-redux-wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createHydratedApi(options: any) {
  return createApi({
    ...options,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extractRehydrationInfo(action: any, { reducerPath }: { reducerPath: string }) {
      if (action?.type === HYDRATE) {
        return action.payload?.[reducerPath];
      }
      return undefined;
    },
  });
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

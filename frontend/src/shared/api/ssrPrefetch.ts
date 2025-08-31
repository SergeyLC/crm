import "server-only";
import { store } from '@/shared/lib/store';

/**
 * Prefetches RTK Query cache for a given endpoint and params.
 * @param endpoint RTK Query endpoint (e.g. leadApi.endpoints.getLeads)
 * @param params Query params for the endpoint
 * @returns Promise<void>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ssrPrefetch<Arg = unknown>(endpoint: { initiate: (arg?: Arg) => any }, params?: Arg): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try {
      await store.dispatch(endpoint.initiate(params));
    } catch (e) {
      console.warn('Failed to prefetch data:', e);
    }
  }
}

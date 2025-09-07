/**
 * Client-side placeholder that mimics the ssrFetch API but doesn't actually fetch.
 * Use this only when you have to import from a client component that might also be used in server components.
 * For actual client-side data fetching, use React Query or SWR.
 * 
 * @param endpoint API endpoint
 * @returns Always returns null
 */
export async function clientFetch<T>(endpoint: string): Promise<T | null> {
  console.warn(
    `[clientFetch] was called for endpoint "${endpoint}". ` +
    `This is a client-side stub that doesn't do any fetching. Use React Query for client fetching instead.`
  );
  return null;
}

// import "server-only";
import { NEXT_PUBLIC_BACKEND_API_URL } from "../config";

/**
 * Server-only fetch implementation for authenticated API requests
 */
export async function ssrFetch<T>(endpoint: string): Promise<T | null> {
  const url = `${NEXT_PUBLIC_BACKEND_API_URL || "/api"}/${endpoint.replace(/^\//, "")}`;
  console.log(`ssrFetch called for ${url}`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include", // Include cookies for server requests
      cache: "no-store",
    });
    if (!res.ok) return null;
    // console.warn(`[Server fetched for ${endpoint}]`);
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[Server fetch failed for ${endpoint}]`, e);
    return null;
  }
}
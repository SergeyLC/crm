import "server-only";
import { cookies } from "next/headers";
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BACKEND_API_URL } from "../config";

/**
 * Generic SSR fetch utility for authenticated API requests.
 * For use in Server Components only.
 * @param endpoint API endpoint (e.g. "deals", "leads")
 * @returns Parsed JSON or null on error
 */
export async function ssrFetch<T>(endpoint: string): Promise<T | null> {
  const base = NEXT_PUBLIC_BACKEND_API_URL || "";
  const url = base
    ? `${base.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
    : `${NEXT_PUBLIC_API_URL || ""}/api/${endpoint.replace(/^\//, "")}`;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[SSR fetch failed for ${endpoint}]`, e);
    return null;
  }
}

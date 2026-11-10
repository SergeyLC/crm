// import "server-only";
import { NEXT_PUBLIC_BACKEND_API_URL } from "../config";

/** Keep in sync with list pages (`export const revalidate = 60`). */
const SSR_REVALIDATE_SECONDS = 60;

function isDynamicServerUsageError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { digest?: string; message?: string };
  return (
    err.digest === "DYNAMIC_SERVER_USAGE" ||
    (typeof err.message === "string" &&
      err.message.includes("Dynamic server usage"))
  );
}

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Server-only fetch implementation for authenticated API requests.
 * Uses ISR-aligned caching so `next build` can statically generate routes
 * that export `revalidate` instead of tripping DYNAMIC_SERVER_USAGE via no-store.
 */
export async function ssrFetch<T>(endpoint: string): Promise<T | null> {
  const url = `${NEXT_PUBLIC_BACKEND_API_URL || "/api"}/${endpoint.replace(/^\//, "")}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include", // Include cookies for server requests
      next: { revalidate: SSR_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    // Next may throw while probing static generation; not a runtime outage.
    if (isDynamicServerUsageError(e)) {
      return null;
    }
    // Backend often unreachable during image build; avoid alarming CI logs.
    if (isProductionBuild()) {
      console.warn(`[Server fetch skipped during build for ${endpoint}]`);
      return null;
    }
    console.warn(`[Server fetch failed for ${endpoint}]`, e);
    return null;
  }
}

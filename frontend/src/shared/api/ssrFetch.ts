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

async function getRequestCookieHeader(): Promise<string | undefined> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const all = store.getAll();
    if (all.length === 0) return undefined;
    return all.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Server-only fetch for authenticated API requests.
 * Forwards the incoming request Cookie header (crm_session) to the backend.
 * Uses no-store when a session cookie is present to avoid cross-user cache leaks;
 * falls back to ISR revalidate during build / unauthenticated probes.
 */
export async function ssrFetch<T>(endpoint: string): Promise<T | null> {
  const url = `${NEXT_PUBLIC_BACKEND_API_URL || "/api"}/${endpoint.replace(/^\//, "")}`;

  try {
    const cookieHeader = await getRequestCookieHeader();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
      ...(cookieHeader
        ? { cache: "no-store" as const }
        : { next: { revalidate: SSR_REVALIDATE_SECONDS } }),
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

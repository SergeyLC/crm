/**
 * Client-side session expiry: when an authenticated API call returns 401,
 * notify listeners so AuthProvider can clear state and ProtectedRoute can
 * send the user to login.
 */

export const SESSION_EXPIRED_EVENT = "crm:session-expired";

let expectAuthenticatedSession = false;
let fetchGuardInstalled = false;
let lastNotifyAt = 0;
const NOTIFY_COOLDOWN_MS = 1000;

const AUTH_EXEMPT_PATH =
  /\/api\/auth\/(login|logout)(?:\?|$)/i;

export function setExpectAuthenticatedSession(value: boolean): void {
  expectAuthenticatedSession = value;
}

export function isExpectingAuthenticatedSession(): boolean {
  return expectAuthenticatedSession;
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function shouldIgnoreUnauthorized(url: string): boolean {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url;
    return AUTH_EXEMPT_PATH.test(path);
  } catch {
    return AUTH_EXEMPT_PATH.test(url);
  }
}

/** Notify AuthProvider (debounced). Safe to call from any client fetch path. */
export function notifySessionExpired(): void {
  if (typeof window === "undefined") return;
  if (!expectAuthenticatedSession) return;

  const now = Date.now();
  if (now - lastNotifyAt < NOTIFY_COOLDOWN_MS) return;
  lastNotifyAt = now;

  expectAuthenticatedSession = false;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

/** Call after any Response from a browser API request. */
export function noteApiResponse(response: Response, requestUrl: string): void {
  if (response.status !== 401) return;
  if (shouldIgnoreUnauthorized(requestUrl)) return;
  notifySessionExpired();
}

/**
 * Patch window.fetch once so entity/apiRequest calls that use raw fetch
 * still trigger session expiry on 401.
 */
export function installSessionExpiryFetchGuard(): () => void {
  if (typeof window === "undefined" || fetchGuardInstalled) {
    return () => undefined;
  }

  fetchGuardInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const response = await originalFetch(input, init);
    noteApiResponse(response, resolveRequestUrl(input));
    return response;
  };

  return () => {
    window.fetch = originalFetch;
    fetchGuardInstalled = false;
  };
}

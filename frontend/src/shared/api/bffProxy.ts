import { NextRequest, NextResponse } from "next/server";

type UpstreamHeadersInit = HeadersInit & Record<string, string>;

/**
 * Build headers for an upstream backend call from a Next BFF request.
 * Forwards Cookie (crm_session) and Authorization (Bearer fallback).
 */
export function upstreamHeaders(
  req: NextRequest,
  extra: UpstreamHeadersInit = {}
): Headers {
  const headers = new Headers(extra);
  if (!headers.has("Content-Type") && !headers.has("content-type")) {
    headers.set("Content-Type", "application/json");
  }

  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const authorization = req.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  // So backend Secure-cookie logic sees the browser's real scheme
  const xfProto = req.headers.get("x-forwarded-proto");
  if (xfProto) {
    headers.set("x-forwarded-proto", xfProto);
  } else if (req.nextUrl.protocol === "https:") {
    headers.set("x-forwarded-proto", "https");
  } else {
    headers.set("x-forwarded-proto", "http");
  }

  return headers;
}

/** Copy Set-Cookie from upstream Response onto a NextResponse. */
export function applySetCookie(from: Response, to: NextResponse): NextResponse {
  const multi =
    typeof from.headers.getSetCookie === "function"
      ? from.headers.getSetCookie()
      : [];

  if (multi.length > 0) {
    for (const value of multi) {
      to.headers.append("set-cookie", value);
    }
    return to;
  }

  const single = from.headers.get("set-cookie");
  if (single) {
    to.headers.append("set-cookie", single);
  }
  return to;
}

/**
 * Parse upstream JSON into NextResponse and propagate Set-Cookie.
 * Strips a top-level `token` field if present (JWT must stay HttpOnly only).
 */
export async function jsonFromUpstream(
  upstream: Response,
  init?: { status?: number; stripToken?: boolean }
): Promise<NextResponse> {
  const status = init?.status ?? upstream.status;
  const stripToken = init?.stripToken ?? true;

  let data: unknown = null;
  const contentType = upstream.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await upstream.json().catch(() => null);
  } else {
    const text = await upstream.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (
    stripToken &&
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "token" in data
  ) {
    const rest = { ...(data as Record<string, unknown>) };
    delete rest.token;
    data = rest;
  }

  const res = NextResponse.json(data ?? {}, { status });
  return applySetCookie(upstream, res);
}

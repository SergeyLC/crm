import { NextResponse } from "next/server";

/** Lightweight liveness probe — keep free of SSR/data fetches. */
export function GET() {
  return NextResponse.json({ ok: true });
}

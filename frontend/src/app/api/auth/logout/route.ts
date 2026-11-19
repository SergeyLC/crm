import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared";
import {
  applySetCookie,
  jsonFromUpstream,
  upstreamHeaders,
} from "@/shared/api/bffProxy";

export async function POST(req: NextRequest) {
  try {
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/logout`, {
      method: "POST",
      headers: upstreamHeaders(req),
      credentials: "include",
    });

    if (response.ok) {
      const res = NextResponse.json({ message: "Logged out successfully" });
      return applySetCookie(response, res);
    }

    return jsonFromUpstream(response);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

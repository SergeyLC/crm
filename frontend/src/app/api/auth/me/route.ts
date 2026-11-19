import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared";
import { jsonFromUpstream, upstreamHeaders } from "@/shared/api/bffProxy";

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/me`, {
      headers: upstreamHeaders(req, { Accept: "application/json" }),
      credentials: "include",
    });

    return jsonFromUpstream(response);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

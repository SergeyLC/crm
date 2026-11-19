import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared";
import { jsonFromUpstream, upstreamHeaders } from "@/shared/api/bffProxy";

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();

    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: upstreamHeaders(req),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      return jsonFromUpstream(response);
    }

    return jsonFromUpstream(response, { stripToken: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

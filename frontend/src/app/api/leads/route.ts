import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

export async function GET() {
  try {
    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/leads/`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Fail to get leads" },
        { status: res.status }
      );
    }

    const data = await res.json();
    // console.log("Fetched leads:", data);
    return NextResponse.json(data);
  } catch (error) {
    // console.error("Url=", `${BACKEND_API_URL}/leads/`);
    console.error("API route error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/leads/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Url=", `${NEXT_PUBLIC_BACKEND_API_URL}/leads/`);
    console.error("API route error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

export async function GET() {
  try {
    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/deals/archived`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Fail to get archived deals" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Url=", `${NEXT_PUBLIC_BACKEND_API_URL}/deals/archived`);
    console.error("API route error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

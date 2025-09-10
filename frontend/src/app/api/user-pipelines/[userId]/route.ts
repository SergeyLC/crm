import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";

interface Params {
  params: Promise<{
    userId: string;
  }>;
}

// GET /api/user-pipelines - Pipelines für aktuellen Benutzer abrufen
export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = await params;
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/pipelines/${userId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user pipelines" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user pipelines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

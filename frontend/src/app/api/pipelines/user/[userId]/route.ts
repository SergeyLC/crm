import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";
import { upstreamHeaders } from "@/shared/api/bffProxy";


interface Params {
  params: Promise<{
    userId: string;
  }>;
}

// GET /api/pipelines/[userId] - Pipelines für einen bestimmten Benutzer abrufen
export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = await params;

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/pipelines/user/${userId}`,
      {
        headers: upstreamHeaders(request),
        credentials: "include",
        // next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch pipelines for user" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching pipelines for user ${userId}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

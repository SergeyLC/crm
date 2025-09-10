import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";

// GET /api/pipelines - Alle Pipelines abrufen
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/pipelines`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      next: { revalidate: 60 }, // Cache für 60 Sekunden
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch pipelines" },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/pipelines - Neue Pipeline erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/pipelines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to create pipeline" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating pipeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

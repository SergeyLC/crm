import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";

// GET /api/users/me - Aktuellen Benutzer abrufen
export async function GET() {
  try {
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/users/me`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Aktuellen Benutzer aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
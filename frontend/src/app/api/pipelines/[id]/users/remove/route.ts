import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/pipelines/[id]/users/remove - Mehrere Benutzer von der Pipeline entfernen
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await  params;
  try {
    const body = await request.json();

    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/pipelines/${id}/users/remove`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to remove users from pipeline" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error removing users from pipeline ${id}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

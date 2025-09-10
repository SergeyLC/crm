import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";

interface Params {
  params: {
    id: string;
    userId: string;
  };
}

// DELETE /api/pipelines/[id]/users/[userId] - Einzelnen Benutzer von Pipeline entfernen
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, userId } = params;
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/pipelines/${id}/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to remove user from pipeline" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error removing user ${userId} from pipeline ${id}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

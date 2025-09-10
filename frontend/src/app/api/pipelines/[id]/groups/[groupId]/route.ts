import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config";

interface Params {
  params: Promise<{
    groupId: string;
    id: string;
  }>;
}

// POST /api/pipelines/[id]/groups - Gruppen zur Pipeline hinzufügen
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, groupId } = await params;
  try {

    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/pipelines/${id}/groups/${groupId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to delete group ${groupId} from pipeline ${id}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error deleting group ${groupId} from pipeline ${id}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

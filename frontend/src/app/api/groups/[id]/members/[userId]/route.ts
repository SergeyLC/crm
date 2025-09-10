import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/groups/${params.id}/members/${params.userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { message: data.message || "Failed to remove user from group" },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "User removed from group" });
  } catch (error) {
    console.error("Remove user from group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

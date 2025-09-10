import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/deals/${id}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to get deal" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const { id } = await params;
    console.error("Url=", `${NEXT_PUBLIC_BACKEND_API_URL}/deals/${id}`);
    console.error("API route error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/deals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to update deal" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const { id } = await params;
    console.error("Url=", `${NEXT_PUBLIC_BACKEND_API_URL}/deals/${id}`);
    console.error("API route error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/deals/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete deal" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { id } = await params;
    console.error("Url=", `${NEXT_PUBLIC_BACKEND_API_URL}/deals/${id}`);
    console.error("API route error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

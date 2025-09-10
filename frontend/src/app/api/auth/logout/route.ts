import { NextRequest, NextResponse } from "next/server";
import {NEXT_PUBLIC_BACKEND_API_URL } from '@/shared';

export async function POST(req: NextRequest) {
  try {
    // Receiving token from request header
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Sending request to your backend API
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
    });

    // If the request is successful, return 200 OK
    if (response.ok) {
      return NextResponse.json({ message: "Logged out successfully" });
    }

    // If there is an error, try to get the message from the response
    const data = await response.json();
    return NextResponse.json(
      { message: data.message || "Failed to logout" },
      { status: response.status }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
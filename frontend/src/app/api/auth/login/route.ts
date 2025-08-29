import { NextRequest, NextResponse } from "next/server";
import {NEXT_PUBLIC_BACKEND_API_URL } from '@/shared';

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();
    
    // Отправляем запрос к вашему бэкенд API
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to login" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
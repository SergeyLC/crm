import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_BACKEND_API_URL } from '@/shared';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    // Proxy validation request to backend. Backend should implement an endpoint
    // that returns non-2xx when deletion is not allowed, otherwise 200/204.
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/groups/${params.id}/validate-delete`, {
      headers: { Authorization: authHeader },
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      // Try to forward JSON body for error message
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json({ message: data.message || 'Validation failed' }, { status: response.status });
      }
      const text = await response.text();
      return NextResponse.json({ message: text || 'Validation failed' }, { status: response.status });
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Validate delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

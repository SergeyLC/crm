// features/auth/api.ts
import { User, LoginCredentials } from "../model";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User }> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to login");
    }
    const responseData = await response.json();
    if (!responseData?.user || !responseData.success) {
      throw new Error(responseData?.message || "Failed to login");
    }
    return { user: responseData.user };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });

    // Logged-out is normal (no session cookie) — not an error
    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const responseData = await response.json();
    if (!responseData?.user || !responseData.success) {
      throw new Error("Failed to get user info");
    }
    return responseData.user;
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};

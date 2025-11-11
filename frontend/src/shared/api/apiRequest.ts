import { NEXT_PUBLIC_API_URL } from '../config';
import { safeJsonParse } from '../lib/safeJsonParse';

export const apiRequest = {
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  },
  
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  },
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // const baseUrl = endpoint.startsWith("/api")
    //   ? NEXT_PUBLIC_API_URL
    //   : NEXT_PUBLIC_BACKEND_API_URL;
    const baseUrl = NEXT_PUBLIC_API_URL;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage =
          errorData.error ||
          errorData.message ||
          `API-Fehler: ${response.status}`;
      } catch {
        errorMessage = errorText || `API-Fehler: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return safeJsonParse<T>(response);
  }
};
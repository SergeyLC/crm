// import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BACKEND_API_URL } from "../config";

// /**
//  * Universal fetch utility for API requests that works in both client and server contexts
//  */
// export async function ssrFetch<T>(endpoint: string): Promise<T | null> {
//   const isServer = typeof window === 'undefined';
  
//   // Server-side execution path
//   if (isServer) {
//     // Dynamischer Import zur Laufzeit, wird nicht im Client-Bundle enthalten
//     const { serverFetch } = await import('./serverFetch');
//     return serverFetch<T>(endpoint);
//   }
  
//   // Client-side execution path
//   const base = NEXT_PUBLIC_BACKEND_API_URL || "";
//   const url = base
//     ? `${base.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
//     : `${NEXT_PUBLIC_API_URL || ""}/api/${endpoint.replace(/^\//, "")}`;
  
//   try {
//     const res = await fetch(url, {
//       method: "GET",
//       headers: {
//         Accept: "application/json",
//       },
//       credentials: "include", // Für Cookies bei Client-Anfragen
//       cache: "no-store",
//     });
    
//     if (!res.ok) return null;
//     return (await res.json()) as T;
//   } catch (e) {
//     console.warn(`[Client fetch failed for ${endpoint}]`, e);
//     return null;
//   }
// }
// import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BACKEND_API_URL } from "../config";

// /**
//  * Generic fetch utility for authenticated API requests.
//  * Works in both client and server environments.
//  * @param endpoint API endpoint (e.g. "deals", "leads")
//  * @returns Parsed JSON or null on error
//  */
// export async function clientFetch<T>(endpoint: string): Promise<T | null> {
//   // Überprüfen, ob wir auf dem Server sind (keine window/document Objekte)
//   const isServer = typeof window === 'undefined';
  
//   // Bei Server-Side Rendering, importiere und verwende serverFetch
//   if (isServer) {
//     try {
//       // Dynamischer Import nur auf dem Server
//       const { ssrFetch } = await import("./ssrFetch");
//       return await ssrFetch<T>(endpoint);
//     } catch (e) {
//       console.warn(`[Server fetch import failed]`, e);
//       return null;
//     }
//   }
  
//   // Client-seitige Implementierung
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
//       credentials: "include", // Für Cookies auf Client-Seite
//       cache: "no-store",
//     });
    
//     if (!res.ok) return null;
//     return (await res.json()) as T;
//   } catch (e) {
//     console.warn(`[Client fetch failed for ${endpoint}]`, e);
//     return null;
//   }
// }

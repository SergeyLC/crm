// import "server-only";
// import { cookies } from "next/headers";
// import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BACKEND_API_URL } from "../config";

// /**
//  * Server-only fetch implementation for authenticated API requests
//  */
// export async function serverFetch<T>(endpoint: string): Promise<T | null> {
//   const base = NEXT_PUBLIC_BACKEND_API_URL || "";
//   const url = base
//     ? `${base.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
//     : `${NEXT_PUBLIC_API_URL || ""}/api/${endpoint.replace(/^\//, "")}`;

//   try {
//     const cookieStore = cookies();
//     const cookieHeader = cookieStore.toString();
//     const res = await fetch(url, {
//       method: "GET",
//       headers: {
//         ...(cookieHeader ? { cookie: cookieHeader } : {}),
//         Accept: "application/json",
//       },
//       cache: "no-store",
//     });

//     if (!res.ok) return null;
//     return (await res.json()) as T;
//   } catch (e) {
//     console.warn(`[Server fetch failed for ${endpoint}]`, e);
//     return null;
//   }
// }
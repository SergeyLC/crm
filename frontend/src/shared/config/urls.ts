export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Normalize backend base URL; allow empty (will rely on relative /api via Next proxy or middleware).
const rawBackend = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
export const NEXT_PUBLIC_BACKEND_API_URL = rawBackend && /^https?:\/\//.test(rawBackend)
  ? rawBackend.replace(/\/+$/,'')
  : '';

if (process.env.NODE_ENV !== 'production' && !NEXT_PUBLIC_BACKEND_API_URL) {
  console.warn('[config] NEXT_PUBLIC_BACKEND_API_URL not set; API clients will use relative paths. Set it in .env.local if needed.');
}

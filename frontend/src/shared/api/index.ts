// Export API utilities - conditionally based on usage context
// ssrFetch is exported directly and should only be imported in server components
// clientFetch can be imported in client components as a safer alternative

// Note: avoid importing ssrFetch directly in client components,
// use clientFetch instead if you need the same API shape
// export { clientFetch } from './clientFetch';
// export { ssrFetch } from './ssrFetch';
export { apiRequest } from './apiRequest';
export { ssrFetch } from './ssrFetch';
export * from './invalidate';

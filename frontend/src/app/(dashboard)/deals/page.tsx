import { DealsTable } from "@/features";
import { store } from "@/shared/lib/store";
import { dealApi } from "@/entities/deal/api";

export default async function DealsPage() {
  // Prefetch data on server for better performance and SEO
  // Only prefetch in production or when backend API is available
  if (process.env.NODE_ENV === 'production' || process.env.BACKEND_API_URL) {
    try {
      await store.dispatch(dealApi.endpoints.getDeals.initiate({}));
    } catch (error) {
      // Silently fail during build if database is not available
      console.warn('Failed to prefetch deals data:', error);
    }
  }

  return <DealsTable />;
}

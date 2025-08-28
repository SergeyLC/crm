import { ArchivedDealsTable } from "@/features/deal";
import { store } from "@/shared/lib/store";
import { dealApi } from "@/entities/deal/api";
import { DealStatus } from "@/shared/generated/prisma-client";

export default async function ArchivedDealsPage() {
  // Prefetch archived deals data on server
  // Only prefetch in production or when backend API is available
  if (process.env.NODE_ENV === 'production' || process.env.BACKEND_API_URL) {
    try {
      await store.dispatch(dealApi.endpoints.getDeals.initiate({
        statuses: [DealStatus.ARCHIVED]
      }));
    } catch (error) {
      // Silently fail during build if backend API is not available
      console.warn('Failed to prefetch archived deals data:', error);
    }
  }

  return <ArchivedDealsTable />;
}

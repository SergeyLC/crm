import { WonLostDealsTable } from "@/features/deal";
import { store } from "@/shared/lib/store";
import { dealApi } from "@/entities/deal/api";
import { DealStage } from "@/shared/generated/prisma-client";

export default async function LostDealsPage() {
  // Prefetch lost deals data on server
  // Only prefetch in production or when backend API is available
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try {
      await store.dispatch(dealApi.endpoints.getLostDeals.initiate({
        stages: [DealStage.LOST]
      }));
    } catch (error) {
      // Silently fail during build if backend API is not available
      console.warn('Failed to prefetch lost deals data:', error);
    }
  }

  return <WonLostDealsTable isWon={false} />;
}

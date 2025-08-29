import { WonLostDealsTable } from "@/features/deal";
import { store } from "@/shared/lib/store";
import { dealApi } from "@/entities/deal/api";
import { DealStage } from "@/shared/generated/prisma-client";

export default async function WonDealsPage() {
  // Prefetch won deals data on server
  // Only prefetch in production or when backend API is available
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try {
      await store.dispatch(dealApi.endpoints.getWonDeals.initiate({
        stages: [DealStage.WON]
      }));
    } catch (error) {
      // Silently fail during build if backend API is not available
      console.warn('Failed to prefetch won deals data:', error);
    }
  }

  return <WonLostDealsTable isWon={true} />;
}

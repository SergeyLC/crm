import { WonLostDealsTable } from '@/features/deal';
import { store } from '@/shared/lib/store';
import { dealApi } from '@/entities/deal/api';
import { DealStage } from '@/shared/generated/prisma-client';

export default async function LostDealsPage() {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try { await store.dispatch(dealApi.endpoints.getLostDeals.initiate({ stages: [DealStage.LOST] })); } catch (e) { console.warn('Failed to prefetch lost deals data:', e); }
  }
  return <WonLostDealsTable isWon={false} />;
}

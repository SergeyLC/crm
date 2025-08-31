import { WonLostDealsTable } from '@/features/deal';
import { ssrPrefetch } from '@/shared/api/ssrPrefetch';
import { dealApi } from '@/entities/deal/api';
import { DealStage } from '@/shared/generated/prisma-client';

export default async function LostDealsPage() {
  await ssrPrefetch(dealApi.endpoints.getLostDeals, { stages: [DealStage.LOST] });
  return <WonLostDealsTable isWon={false} />;
}

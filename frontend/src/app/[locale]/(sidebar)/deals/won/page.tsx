import { WonLostDealsTable } from '@/features/deal';
import { ssrPrefetch } from '@/shared/api/ssrPrefetch';
import { dealApi } from '@/entities/deal/api';
import { DealStage } from '@/shared/generated/prisma-client';

export default async function WonDealsPage() {
  await ssrPrefetch(dealApi.endpoints.getWonDeals, { stages: [DealStage.WON] });
  return <WonLostDealsTable isWon={true} />;
}

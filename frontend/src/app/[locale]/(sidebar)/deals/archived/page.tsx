import { ArchivedDealsTable } from '@/features/deal';
import { dealApi } from '@/entities/deal/api';
import { DealStatus } from '@/shared/generated/prisma-client';
import { ssrPrefetch } from '@/shared/api/ssrPrefetch';

export default async function ArchivedDealsPage() {
  await ssrPrefetch(dealApi.endpoints.getDeals, { statuses: [DealStatus.ARCHIVED] });
  return <ArchivedDealsTable />;
}

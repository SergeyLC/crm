import { ArchivedDealsTable } from '@/features/deal';
import { store } from '@/shared/lib/store';
import { dealApi } from '@/entities/deal/api';
import { DealStatus } from '@/shared/generated/prisma-client';

export default async function ArchivedDealsPage() {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try {
      await store.dispatch(dealApi.endpoints.getDeals.initiate({ statuses: [DealStatus.ARCHIVED] }));
    } catch (error) {
      console.warn('Failed to prefetch archived deals data:', error);
    }
  }
  return <ArchivedDealsTable />;
}

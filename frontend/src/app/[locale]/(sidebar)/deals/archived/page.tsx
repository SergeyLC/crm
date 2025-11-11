import { ArchivedDealsTable } from '@/features/deal';
import { Suspense } from 'react';
import { ssrFetch } from '@/shared/api';
import { DealExt } from '@/entities/deal';

export const revalidate = 60;

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

// Loading component for archived deals
function ArchivedDealsLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '16px',
      color: '#666'
    }}>
      Loading archived deals...
    </div>
  );
}

export default async function ArchivedDealsPage() {
  const deals = await ssrFetch<DealExt[]>("deals/archived");

  return (
    <Suspense fallback={<ArchivedDealsLoading />}>
      <ArchivedDealsTable initialData={deals || undefined} />
    </Suspense>
  );
}
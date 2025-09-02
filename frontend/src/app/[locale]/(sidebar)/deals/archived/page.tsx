import { ArchivedDealsTable } from '@/features/deal';
import { Suspense } from 'react';

// ISR configuration - will be ignored in development
export const revalidate = 60;

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
  return (
    <Suspense fallback={<ArchivedDealsLoading />}>
      <ArchivedDealsTable />
    </Suspense>
  );
}
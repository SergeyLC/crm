import { Suspense } from 'react';
import { LeadsTable } from '@/features';
import { ssrFetch } from '@/shared/api';
import { LeadExt } from '@/entities/lead';

export const revalidate = 60;

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

// Loading component for archived leads
function ArchivedLeadsLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '16px',
      color: '#666'
    }}>
      Loading...
    </div>
  );
}

export default async function ArchivedLeadsPage() {
  const leads = await ssrFetch<LeadExt[]>("leads/archived");

  return (
    <Suspense fallback={<ArchivedLeadsLoading />}>
      <LeadsTable showArchived={true} initialData={leads || undefined} />
    </Suspense>
  );
}

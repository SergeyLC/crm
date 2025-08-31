import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';
import { store } from '@/shared/lib/store';
import { leadApi } from '@/entities/lead/api';
import { LeadExt } from '@/entities/lead';

export default async function ArchivedLeadsPage() {
  let initialData: LeadExt[] | undefined = undefined;
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
  try { const result = await store.dispatch(leadApi.endpoints.getArchivedLeads.initiate()); initialData = result.data as LeadExt[] | undefined; } catch (e) { console.warn('Failed to prefetch archived leads data:', e); }
  }
  return (
    <Container maxWidth="xl">
      <LeadsTable initialData={initialData} showArchived={true} />
    </Container>
  );
}

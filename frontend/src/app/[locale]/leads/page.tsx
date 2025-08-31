import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';
import { store } from '@/shared/lib/store';
import { leadApi } from '@/entities/lead/api';

export default async function LeadsPage() {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try { await store.dispatch(leadApi.endpoints.getLeads.initiate()); } catch (e) { console.warn('Failed to prefetch leads data:', e); }
  }
  return (
    <Container maxWidth="xl">
      <LeadsTable />
    </Container>
  );
}

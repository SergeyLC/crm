import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';
import { ssrFetch } from '@/shared/api/ssrFetch';
import { LeadExt } from '@/entities/lead/types';

export default async function LeadsPage() {
  const leads = await ssrFetch<LeadExt[]>("leads");
  return (
    <Container maxWidth="xl">
      <LeadsTable initialData={leads || undefined} />
    </Container>
  );
}

import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';
import { ssrPrefetch } from '@/shared/api/ssrPrefetch';
import { leadApi } from '@/entities/lead/api';

export default async function ArchivedLeadsPage() {
  await ssrPrefetch(leadApi.endpoints.getArchivedLeads);
  return (
    <Container maxWidth="xl">
      <LeadsTable showArchived={true} />
    </Container>
  );
}

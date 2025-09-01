import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';

export default async function LeadsPage() {
  const leads = undefined; //await ssrFetch<LeadExt[]>("leads");
  return (
    <Container maxWidth="xl">
      <LeadsTable initialData={leads || undefined} />
    </Container>
  );
}

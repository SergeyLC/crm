import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';

export default async function ArchivedLeadsPage() {
  return (
    <Container maxWidth="xl">
      <LeadsTable showArchived={true} />
    </Container>
  );
}

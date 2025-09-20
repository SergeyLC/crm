import { LeadsTable } from '@/features';
import Container from '@mui/material/Container';
import { ssrFetch } from '@/shared/api'; 
import { LeadExt } from '@/entities/lead';

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

// ISR configuration - will be ignored in development
export const revalidate = 60;

export default async function LeadsPage() {
  const leads = await ssrFetch<LeadExt[]>("leads");
  return (
    <Container maxWidth="xl">
      <LeadsTable initialData={leads || undefined} />
    </Container>
  );
}

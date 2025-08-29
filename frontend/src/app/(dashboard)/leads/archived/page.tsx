import { LeadsTable } from "@/features";
import Container from "@mui/material/Container";
import { store } from "@/shared/lib/store";
import { leadApi } from "@/entities/lead/api";

export default async function ArchivedLeadsPage() {
  // Prefetch archived leads data on server for better performance and SEO
  let initialData = undefined;
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try {
      const result = await store.dispatch(leadApi.endpoints.getArchivedLeads.initiate());
      initialData = result.data;
    } catch (error) {
      // Silently fail during build if backend API is not available
      console.warn('Failed to prefetch archived leads data:', error);
    }
  }

  return (
    <Container maxWidth="xl">
      <LeadsTable initialData={initialData} showArchived={true} />
    </Container>
  );
}

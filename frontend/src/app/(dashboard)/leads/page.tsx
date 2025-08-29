import { LeadsTable } from "@/features";
import Container from "@mui/material/Container";
import { store } from "@/shared/lib/store";
import { leadApi } from "@/entities/lead/api";

export default async function LeadsPage() {
  // Prefetch data on server for better performance and SEO
  // Only prefetch in production or when backend API is available
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    try {
      await store.dispatch(leadApi.endpoints.getLeads.initiate());
    } catch (error) {
      // Silently fail during build if backend API is not available
      console.warn('Failed to prefetch leads data:', error);
    }
  }

  return (
    <Container maxWidth="xl">
      <LeadsTable />
    </Container>
  );
}

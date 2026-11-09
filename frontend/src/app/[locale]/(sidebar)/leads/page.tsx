import { LeadsTable } from "@/features";
import Container from "@mui/material/Container";

// Client-side fetch only — avoids SSR of full lead graphs into the Node heap.
export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

export default function LeadsPage() {
  return (
    <Container maxWidth="xl">
      <LeadsTable />
    </Container>
  );
}

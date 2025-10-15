import { LeadsTable } from "@/features";
import Container from "@mui/material/Container";
import { ssrFetch } from "@/shared/api";
import { LeadExt } from "@/entities/lead";

type LeadsPageSearchParams = Record<string, string | string[] | undefined>;

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

// Disable ISR in development/test to allow Cypress hooks to control data fetching
export const revalidate = 60;
export const dynamic = 'auto';

type LeadsPageProps = {
  params: { locale: string };
  searchParams?: Promise<LeadsPageSearchParams>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {

  const resolvedSearchParams = (await searchParams) ?? {};

  const shouldSkipSsr =
    resolvedSearchParams.disableSsr == "on" || resolvedSearchParams.cypress == "on";

  const leads = shouldSkipSsr
    ? undefined
    : (await ssrFetch<LeadExt[]>("leads")) || undefined;

  return (
    <Container maxWidth="xl">
      <LeadsTable initialData={leads} />
    </Container>
  );
}

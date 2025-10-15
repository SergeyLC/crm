import { DealExt } from "@/entities";
import { DealsTable } from "@/features";
import { ssrFetch } from "@/shared/api";

// ISR configuration - will be ignored in development
export const revalidate = 60;
export const dynamic = 'auto';

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

type DealsPageSearchParams = Record<string, string | string[] | undefined>;

type DealsPageProps = {
  params: { locale: string };
  searchParams?: Promise<DealsPageSearchParams>;
};

export default async function DealsPage({ searchParams }: DealsPageProps) {

  const resolvedSearchParams = (await searchParams) ?? {};

  const shouldSkipSsr =
    resolvedSearchParams.disableSsr == "on" || resolvedSearchParams.cypress == "on";

  const deals = shouldSkipSsr
    ? undefined
    : (await ssrFetch<DealExt[]>("deals")) || undefined;

  return <DealsTable initialData={deals} />;
}

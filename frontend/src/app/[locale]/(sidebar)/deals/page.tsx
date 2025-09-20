import { DealExt } from "@/entities";
import { DealsTable } from "@/features";
import { ssrFetch } from "@/shared/api";

// ISR configuration - will be ignored in development
export const revalidate = 60;

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

export default async function DealsPage() {
  const deals = await ssrFetch<DealExt[]>("deals");

  return <DealsTable initialData={deals || undefined} />;
}
